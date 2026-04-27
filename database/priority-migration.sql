-- Priority hybrid migration for incidents
-- Safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS public.area_priority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL UNIQUE REFERENCES public.areas(id) ON DELETE CASCADE,
  base_priority text NOT NULL CHECK (base_priority IN ('baja', 'media', 'alta', 'urgente')),
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.priority_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  priority text NOT NULL CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incident_priority_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  previous_priority text,
  new_priority text NOT NULL,
  reason text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS user_marked_urgent boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.normalize_incident_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(
    translate(
      coalesce(input_text, ''),
      'áàäâãéèëêíìïîóòöôõúùüûñ',
      'aaaaaeeeeiiiiooooouuuun'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.priority_level(priority_value text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE coalesce(priority_value, 'media')
    WHEN 'baja' THEN 1
    WHEN 'media' THEN 2
    WHEN 'alta' THEN 3
    WHEN 'urgente' THEN 4
    ELSE 2
  END;
$$;

CREATE OR REPLACE FUNCTION public.priority_from_level(level_value integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE least(greatest(coalesce(level_value, 2), 1), 4)
    WHEN 1 THEN 'baja'
    WHEN 2 THEN 'media'
    WHEN 3 THEN 'alta'
    WHEN 4 THEN 'urgente'
  END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_incident_priority(
  p_area_id uuid,
  p_description text,
  p_user_marked_urgent boolean DEFAULT false
)
RETURNS TABLE(priority text, reason text)
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_description text := public.normalize_incident_text(p_description);
  base_priority_value text := 'media';
  base_level integer := 2;
  max_keyword_level integer := 0;
  selected_level integer := 2;
  matched_keywords text := '';
  keyword_reason text := '';
  urgent_reason text := '';
BEGIN
  SELECT apr.base_priority
  INTO base_priority_value
  FROM public.area_priority_rules apr
  WHERE apr.area_id = p_area_id;

  base_priority_value := coalesce(base_priority_value, 'media');
  base_level := public.priority_level(base_priority_value);

  SELECT
    coalesce(max(public.priority_level(pk.priority)), 0),
    coalesce(string_agg(pk.keyword, ', ' ORDER BY public.priority_level(pk.priority) DESC, pk.keyword), '')
  INTO max_keyword_level, matched_keywords
  FROM public.priority_keywords pk
  WHERE position(public.normalize_incident_text(pk.keyword) in normalized_description) > 0;

  selected_level := greatest(base_level, max_keyword_level);

  IF coalesce(p_user_marked_urgent, false) THEN
    selected_level := least(selected_level + 1, 4);
    urgent_reason := ' | usuario marco urgente (+1 nivel)';
  END IF;

  priority := public.priority_from_level(selected_level);

  IF max_keyword_level > 0 THEN
    keyword_reason := ' | keywords detectadas: ' || matched_keywords;
  END IF;

  reason := 'base_area=' || base_priority_value || keyword_reason || urgent_reason;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_incident_priority_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  calc record;
  should_recalculate boolean := false;
  is_manual_priority_update boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    should_recalculate := true;
  ELSE
    should_recalculate := (
      NEW.area_id IS DISTINCT FROM OLD.area_id OR
      NEW.description IS DISTINCT FROM OLD.description OR
      NEW.user_marked_urgent IS DISTINCT FROM OLD.user_marked_urgent
    );
  END IF;

  IF should_recalculate THEN
    SELECT *
    INTO calc
    FROM public.calculate_incident_priority(
      NEW.area_id,
      NEW.description,
      NEW.user_marked_urgent
    );

    NEW.priority := calc.priority;

    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.incident_priority_logs (incident_id, previous_priority, new_priority, reason)
      VALUES (NEW.id, NULL, NEW.priority, calc.reason);
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.incident_priority_logs (incident_id, previous_priority, new_priority, reason)
      VALUES (NEW.id, OLD.priority, NEW.priority, calc.reason);
    END IF;
  ELSE
    is_manual_priority_update := (
      TG_OP = 'UPDATE' AND
      NEW.priority IS DISTINCT FROM OLD.priority
    );

    IF is_manual_priority_update THEN
      INSERT INTO public.incident_priority_logs (incident_id, previous_priority, new_priority, reason)
      VALUES (NEW.id, OLD.priority, NEW.priority, 'actualizacion manual de prioridad');
    ELSE
      NEW.priority := OLD.priority;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_incident_priority ON public.incidents;

CREATE TRIGGER trg_set_incident_priority
BEFORE INSERT OR UPDATE ON public.incidents
FOR EACH ROW
EXECUTE FUNCTION public.set_incident_priority_trigger();

INSERT INTO public.area_priority_rules (area_id, base_priority)
SELECT a.id, 'urgente'
FROM public.areas a
WHERE public.normalize_incident_text(a.name) = 'seguridad'
ON CONFLICT (area_id) DO UPDATE
SET base_priority = EXCLUDED.base_priority;

INSERT INTO public.area_priority_rules (area_id, base_priority)
SELECT a.id, 'alta'
FROM public.areas a
WHERE public.normalize_incident_text(a.name) = 'electricidad'
ON CONFLICT (area_id) DO UPDATE
SET base_priority = EXCLUDED.base_priority;

INSERT INTO public.area_priority_rules (area_id, base_priority)
SELECT a.id, 'baja'
FROM public.areas a
WHERE public.normalize_incident_text(a.name) = 'limpieza'
ON CONFLICT (area_id) DO UPDATE
SET base_priority = EXCLUDED.base_priority;

INSERT INTO public.area_priority_rules (area_id, base_priority)
SELECT a.id, 'media'
FROM public.areas a
WHERE public.normalize_incident_text(a.name) = 'mantenimiento'
ON CONFLICT (area_id) DO UPDATE
SET base_priority = EXCLUDED.base_priority;

INSERT INTO public.priority_keywords (keyword, priority)
VALUES
  ('humo', 'urgente'),
  ('fuga', 'alta'),
  ('inundacion', 'urgente'),
  ('chispa', 'urgente')
ON CONFLICT (keyword) DO UPDATE
SET priority = EXCLUDED.priority;

COMMIT;
