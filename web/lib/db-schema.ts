// lib/db-schema.ts
export const DB_SCHEMA = `
Tienes acceso a una base de datos PostgreSQL (Supabase) con las siguientes tablas:

CREATE TABLE incidents (
  id uuid primary key,
  title text not null,
  description text not null,
  status text check (status in ('pendiente', 'recibida', 'en_progreso', 'resuelta')) default 'pendiente',
  priority text check (priority in ('baja', 'media', 'alta', 'urgente')) default 'media',
  area_id uuid references areas(id),
  room_id uuid references rooms(id),
  created_by uuid references profiles(id),
  assigned_to uuid references profiles(id),
  created_at timestamp default now(),
  updated_at timestamp
);

CREATE TABLE profiles (
  id uuid primary key,
  email text,
  role text check (role in ('admin', 'staff', 'empleado', 'guest')),
  full_name text,
  area text,
  active boolean,
  created_at timestamp default now()
);

CREATE TABLE areas (
  id uuid primary key,
  name text unique not null
);

CREATE TABLE rooms (
  id uuid primary key,
  room_code text not null,
  floor text,
  active boolean default true
);

CREATE TABLE incident_resolutions (
  id uuid primary key,
  incident_id uuid references incidents(id),
  resolved_by uuid references profiles(id),
  description text not null,
  created_at timestamp default now()
);

CREATE TABLE incident_evidence (
  id uuid primary key,
  incident_id uuid references incidents(id),
  image_url text not null,
  uploaded_at timestamp default now()
);

CREATE TABLE guest_sessions (
  id uuid primary key,
  room_id uuid references rooms(id),
  access_code text not null,
  active boolean default true,
  expires_at timestamp not null,
  created_at timestamp default now()
);

REGLAS IMPORTANTES:
- La tabla de incidencias se llama EXACTAMENTE "incidents" (en inglés, no "incidencias")
- La tabla de perfiles/usuarios se llama EXACTAMENTE "profiles" (no "usuarios")
- Solo genera consultas SELECT, nunca INSERT/UPDATE/DELETE/DROP
- Para joins con nombres usa: JOIN profiles p ON i.assigned_to = p.id
- Para filtros de fecha usa created_at
- "hoy" = created_at::date = CURRENT_DATE
- "esta semana" = created_at >= DATE_TRUNC('week', NOW())
- "este mes" = created_at >= DATE_TRUNC('month', NOW())
- Devuelve SOLO el SQL puro, sin explicaciones, sin bloques de código, sin backticks, sin punto y coma al final
- Cuando se pida nombre de usuario hacer JOIN con profiles usando assigned_to o created_by
`