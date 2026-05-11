-- ============================================================
-- DORITA FIT — Sistema de gestión para instructoras
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── ALUMNAS ──────────────────────────────────────────────────
create table if not exists alumnas (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  email text,
  telefono text,
  foto_url text,
  objetivo text,
  nivel text default 'Principiante' check (nivel in ('Principiante','Intermedio','Avanzado')),
  peso_inicial numeric,
  peso_actual numeric,
  peso_objetivo numeric,
  fecha_inicio date default current_date,
  activa boolean default true,
  notas text,
  created_at timestamptz default now()
);

-- ── RUTINAS ──────────────────────────────────────────────────
create table if not exists rutinas (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text,
  nivel text default 'Principiante' check (nivel in ('Principiante','Intermedio','Avanzado')),
  duracion_min integer default 45,
  categoria text default 'Full Body',
  foto_url text,
  created_at timestamptz default now()
);

-- ── EJERCICIOS ───────────────────────────────────────────────
create table if not exists ejercicios (
  id uuid default uuid_generate_v4() primary key,
  rutina_id uuid references rutinas(id) on delete cascade,
  nombre text not null,
  series integer default 3,
  repeticiones text default '12',
  descanso_seg integer default 60,
  instrucciones text,
  video_url text,
  orden integer default 0
);

-- ── ASIGNACIONES RUTINAS ─────────────────────────────────────
create table if not exists asignaciones_rutinas (
  id uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  rutina_id uuid references rutinas(id) on delete cascade,
  fecha_inicio date default current_date,
  fecha_fin date,
  progreso integer default 0,
  activa boolean default true,
  created_at timestamptz default now()
);

-- ── SESIONES ─────────────────────────────────────────────────
create table if not exists sesiones (
  id uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hora_inicio time not null,
  hora_fin time,
  tipo text default 'Online' check (tipo in ('Online','Presencial')),
  estado text default 'Programada' check (estado in ('Programada','Completada','Cancelada')),
  notas text,
  link_videollamada text,
  created_at timestamptz default now()
);

-- ── PAGOS ────────────────────────────────────────────────────
create table if not exists pagos (
  id uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  concepto text not null,
  monto numeric not null,
  moneda text default 'COP',
  estado text default 'Pendiente' check (estado in ('Pendiente','Pagado','Vencido')),
  fecha_vencimiento date not null,
  fecha_pago date,
  metodo_pago text,
  notas text,
  created_at timestamptz default now()
);

-- ── MENSAJES ─────────────────────────────────────────────────
create table if not exists mensajes (
  id uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  contenido text not null,
  de_instructora boolean default true,
  leido boolean default false,
  created_at timestamptz default now()
);

-- ── PROGRESO PESO ────────────────────────────────────────────
create table if not exists progreso_peso (
  id uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  peso numeric not null,
  fecha date default current_date,
  notas text
);

-- ── RLS ──────────────────────────────────────────────────────
alter table alumnas enable row level security;
alter table rutinas enable row level security;
alter table ejercicios enable row level security;
alter table asignaciones_rutinas enable row level security;
alter table sesiones enable row level security;
alter table pagos enable row level security;
alter table mensajes enable row level security;
alter table progreso_peso enable row level security;

-- Políticas: solo usuarios autenticados (la instructora)
create policy "auth_all" on alumnas for all using (auth.uid() is not null);
create policy "auth_all" on rutinas for all using (auth.uid() is not null);
create policy "auth_all" on ejercicios for all using (auth.uid() is not null);
create policy "auth_all" on asignaciones_rutinas for all using (auth.uid() is not null);
create policy "auth_all" on sesiones for all using (auth.uid() is not null);
create policy "auth_all" on pagos for all using (auth.uid() is not null);
create policy "auth_all" on mensajes for all using (auth.uid() is not null);
create policy "auth_all" on progreso_peso for all using (auth.uid() is not null);

-- ── STORAGE ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('fotos-dorita', 'fotos-dorita', true)
on conflict (id) do nothing;

create policy "fotos_upload" on storage.objects for insert with check (bucket_id = 'fotos-dorita');
create policy "fotos_public" on storage.objects for select using (bucket_id = 'fotos-dorita');

-- ── DATOS DE EJEMPLO ─────────────────────────────────────────
insert into alumnas (nombre, email, telefono, objetivo, nivel, peso_inicial, peso_actual, peso_objetivo, fecha_inicio) values
  ('Valeria Antolinez', 'valeria@email.com', '+573001234567', 'Tonificar y ganar confianza', 'Avanzado', 68, 65, 58, '2025-01-10'),
  ('Sara Martínez', 'sara@email.com', '+573009876543', 'Bajar de peso y mejorar resistencia', 'Intermedio', 75, 72, 62, '2025-02-01'),
  ('Laura Castillo', 'laura@email.com', null, 'Ganar masa muscular', 'Principiante', 55, 56, 60, '2025-03-15')
on conflict do nothing;

insert into rutinas (nombre, descripcion, nivel, duracion_min, categoria) values
  ('Fuerza & Confianza', 'Rutina de fuerza para tonificar y ganar seguridad', 'Avanzado', 45, 'Fuerza'),
  ('Piernas de acero', 'Enfocada en cuádriceps, glúteos y pantorrillas', 'Intermedio', 50, 'Tren inferior'),
  ('Full Body Burn', 'Entrenamiento completo para quemar grasa', 'Principiante', 40, 'Full Body')
on conflict do nothing;