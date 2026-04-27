-- Priority logic tests
-- Run manually after applying priority-migration.sql
-- This script is non-destructive because it ends with ROLLBACK.

BEGIN;

DO $$
DECLARE
  area_limpieza uuid := gen_random_uuid();
  area_mantenimiento uuid := gen_random_uuid();
  area_electricidad uuid := gen_random_uuid();
  area_sin_regla uuid := gen_random_uuid();
  result_priority text;
  result_reason text;
BEGIN
  INSERT INTO public.areas (id, name) VALUES
    (area_limpieza, 'Limpieza Test'),
    (area_mantenimiento, 'Mantenimiento Test'),
    (area_electricidad, 'Electricidad Test'),
    (area_sin_regla, 'Recepcion Test')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.area_priority_rules (area_id, base_priority) VALUES
    (area_limpieza, 'baja'),
    (area_mantenimiento, 'media'),
    (area_electricidad, 'alta')
  ON CONFLICT (area_id) DO UPDATE SET base_priority = EXCLUDED.base_priority;

  INSERT INTO public.priority_keywords (keyword, priority) VALUES
    ('humo', 'urgente'),
    ('fuga', 'alta'),
    ('inundacion', 'urgente'),
    ('chispa', 'urgente')
  ON CONFLICT (keyword) DO UPDATE SET priority = EXCLUDED.priority;

  -- Caso 1: limpieza + "bombillo quemado" + urgente false => baja
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_limpieza, 'bombillo quemado', false);

  IF result_priority <> 'baja' THEN
    RAISE EXCEPTION 'Caso 1 fallo. Esperado=baja, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Caso 2: mantenimiento + "fuga de agua" => alta
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_mantenimiento, 'fuga de agua en el bano', false);

  IF result_priority <> 'alta' THEN
    RAISE EXCEPTION 'Caso 2 fallo. Esperado=alta, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Caso 3: electricidad + "sale humo" => urgente
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_electricidad, 'sale humo del enchufe', false);

  IF result_priority <> 'urgente' THEN
    RAISE EXCEPTION 'Caso 3 fallo. Esperado=urgente, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Borde: area sin regla => media
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_sin_regla, 'sin coincidencias', false);

  IF result_priority <> 'media' THEN
    RAISE EXCEPTION 'Fallback fallo. Esperado=media, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Borde: multiples keywords => prioridad maxima urgente
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_mantenimiento, 'hay fuga y humo en pasillo', false);

  IF result_priority <> 'urgente' THEN
    RAISE EXCEPTION 'Multiples keywords fallo. Esperado=urgente, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Borde: urgente usuario sube solo +1 nivel (baja -> media)
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_limpieza, 'sin palabras clave', true);

  IF result_priority <> 'media' THEN
    RAISE EXCEPTION 'Urgente +1 fallo. Esperado=media, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  -- Borde: case-insensitive + coincidencia parcial
  SELECT priority, reason
  INTO result_priority, result_reason
  FROM public.calculate_incident_priority(area_mantenimiento, 'Se detecto HUMO dentro del cuarto', false);

  IF result_priority <> 'urgente' THEN
    RAISE EXCEPTION 'Case-insensitive/parcial fallo. Esperado=urgente, obtenido=% (reason=%)', result_priority, result_reason;
  END IF;

  RAISE NOTICE 'Todos los tests de prioridad pasaron correctamente.';
END $$;

ROLLBACK;
