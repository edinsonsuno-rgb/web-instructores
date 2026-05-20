-- ============================================================
-- DORITA FIT — Sistema multi-rol
-- Roles: owner (dueño), admin (profe), alumno (estudiante)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- NOTA: La tabla profiles ya existe, no se recrea aquí
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── ALUMNAS ──────────────────────────────────────────────────
create table if not exists alumnas (
  id            uuid default uuid_generate_v4() primary key,
  nombre        text not null,
  email         text,
  telefono      text,
  foto_url      text,
  objetivo      text,
  nivel         text default 'Principiante'
                  check (nivel in ('Principiante','Intermedio','Avanzado')),
  peso_inicial  numeric,
  peso_actual   numeric,
  peso_objetivo numeric,
  fecha_inicio  date default current_date,
  activa        boolean default true,
  notas         text,
  instructor_id uuid references profiles(id),
  user_id       uuid references auth.users(id),
  created_at    timestamptz default now()
);

-- ── RUTINAS (sistema legacy — se mantiene por compatibilidad) ─
create table if not exists rutinas (
  id           uuid default uuid_generate_v4() primary key,
  nombre       text not null,
  descripcion  text,
  nivel        text default 'Principiante'
                 check (nivel in ('Principiante','Intermedio','Avanzado')),
  duracion_min integer default 45,
  categoria    text default 'Full Body',
  foto_url     text,
  created_by   uuid references profiles(id),
  created_at   timestamptz default now()
);

-- ── EJERCICIOS (sistema legacy — se mantiene por compatibilidad) ─
create table if not exists ejercicios (
  id            uuid default uuid_generate_v4() primary key,
  rutina_id     uuid references rutinas(id) on delete cascade,
  nombre        text not null,
  series        integer default 3,
  repeticiones  text default '12',
  descanso_seg  integer default 60,
  instrucciones text,
  video_url     text,
  orden         integer default 0
);

-- ── ASIGNACIONES RUTINAS (sistema legacy) ────────────────────
create table if not exists asignaciones_rutinas (
  id           uuid default uuid_generate_v4() primary key,
  alumna_id    uuid references alumnas(id) on delete cascade,
  rutina_id    uuid references rutinas(id) on delete cascade,
  fecha_inicio date default current_date,
  fecha_fin    date,
  progreso     integer default 0,
  activa       boolean default true,
  created_at   timestamptz default now()
);

-- ── SESIONES ─────────────────────────────────────────────────
create table if not exists sesiones (
  id                uuid default uuid_generate_v4() primary key,
  alumna_id         uuid references alumnas(id) on delete cascade,
  titulo            text not null,
  fecha             date not null,
  hora_inicio       time not null,
  hora_fin          time,
  tipo              text default 'Online'
                      check (tipo in ('Online','Presencial')),
  estado            text default 'Programada'
                      check (estado in ('Programada','Completada','Cancelada')),
  notas             text,
  link_videollamada text,
  created_at        timestamptz default now()
);

-- ── PAGOS ────────────────────────────────────────────────────
create table if not exists pagos (
  id                uuid default uuid_generate_v4() primary key,
  alumna_id         uuid references alumnas(id) on delete cascade,
  concepto          text not null,
  monto             numeric not null,
  moneda            text default 'COP',
  estado            text default 'Pendiente'
                      check (estado in ('Pendiente','Pagado','Vencido')),
  fecha_vencimiento date not null,
  fecha_pago        date,
  metodo_pago       text,
  notas             text,
  created_at        timestamptz default now()
);

-- ── MENSAJES ─────────────────────────────────────────────────
create table if not exists mensajes (
  id             uuid default uuid_generate_v4() primary key,
  alumna_id      uuid references alumnas(id) on delete cascade,
  contenido      text not null,
  de_instructora boolean default true,
  leido          boolean default false,
  created_at     timestamptz default now()
);

-- ── PROGRESO PESO ────────────────────────────────────────────
create table if not exists progreso_peso (
  id        uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  peso      numeric not null,
  fecha     date default current_date,
  notas     text
);

-- ── RECETAS (PDF descargables) ───────────────────────────────
create table if not exists recetas (
  id          uuid default uuid_generate_v4() primary key,
  titulo      text not null,
  descripcion text,
  archivo_url text,
  categoria   text,
  activa      boolean default true,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);

-- ── CATÁLOGO DE EJERCICIOS ───────────────────────────────────
-- El owner sube los ejercicios con sus dos fotos (posición inicial y final).
-- La animación crossfade entre foto_inicio_url y foto_fin_url se hace en el frontend.
-- duracion_seg: tiempo estimado de ejecución del ejercicio (lo define el owner).
create table if not exists catalogo_ejercicios (
  id              uuid default uuid_generate_v4() primary key,
  nombre          text not null,
  zona            text not null check (zona in (
                    'tren_superior','tren_inferior','core','cuerpo_completo'
                  )),
  musculo         text check (musculo in (
                    'pecho','espalda','hombros','biceps','triceps',
                    'cuadriceps','isquiotibiales','gluteos','pantorrillas',
                    'abdomen','lumbares'
                  )),
  foto_inicio_url text,           -- posición inicial del ejercicio
  foto_fin_url    text,           -- posición final del ejercicio
  duracion_seg    integer default 60, -- duración estimada de ejecución (segundos)
  created_by      uuid references profiles(id),
  created_at      timestamptz default now()
);

-- ── RUTINA PERSONALIZADA POR ALUMNA ─────────────────────────
-- Una rutina por alumna organizada por días de la semana.
-- La profe asigna ejercicios a cada día y define descanso y series/reps.
-- dia: día de la semana (lunes a domingo) o 'descanso'.
-- descanso_seg: tiempo de descanso entre series que la profe define por alumna.
-- orden: posición del ejercicio dentro del día.
create table if not exists rutina_ejercicios (
  id           uuid default uuid_generate_v4() primary key,
  alumna_id    uuid references alumnas(id) on delete cascade,
  ejercicio_id uuid references catalogo_ejercicios(id),
  dia          text not null default 'lunes' check (dia in (
                 'lunes','martes','miercoles','jueves','viernes','sabado','domingo'
               )),
  series       integer default 3,
  repeticiones text default '12',
  descanso_seg integer default 60, -- descanso entre series (lo ajusta la profe)
  orden        integer default 0
);

-- ── DÍAS DE DESCANSO POR ALUMNA ──────────────────────────────
-- La profe marca qué días son de descanso para cada alumna.
-- Si un día está aquí, se muestra como descanso aunque tenga ejercicios.
create table if not exists rutina_descansos (
  id        uuid default uuid_generate_v4() primary key,
  alumna_id uuid references alumnas(id) on delete cascade,
  dia       text not null check (dia in (
              'lunes','martes','miercoles','jueves','viernes','sabado','domingo'
            )),
  unique (alumna_id, dia)
);

-- ── ACTIVAR RLS EN TODAS LAS TABLAS ─────────────────────────
alter table alumnas              enable row level security;
alter table rutinas              enable row level security;
alter table ejercicios           enable row level security;
alter table asignaciones_rutinas enable row level security;
alter table sesiones             enable row level security;
alter table pagos                enable row level security;
alter table mensajes             enable row level security;
alter table progreso_peso        enable row level security;
alter table recetas              enable row level security;
alter table catalogo_ejercicios  enable row level security;
alter table rutina_ejercicios    enable row level security;
alter table rutina_descansos     enable row level security;

-- ============================================================
-- POLÍTICAS RLS POR ROL
-- owner  → ve y gestiona todo
-- admin  → gestiona solo sus alumnas y sus datos
-- alumno → solo ve su propia información
-- ============================================================

-- ── ALUMNAS ──────────────────────────────────────────────────
create policy "owner_todo_alumnas" on alumnas for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_alumnas" on alumnas for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and instructor_id = auth.uid()
  );

create policy "alumno_su_perfil" on alumnas for select
  using (user_id = auth.uid());

-- ── RUTINAS (legacy) ─────────────────────────────────────────
create policy "owner_admin_todo_rutinas" on rutinas for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin')));

create policy "alumno_ver_rutinas" on rutinas for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'alumno'));

-- ── EJERCICIOS (legacy) ──────────────────────────────────────
create policy "owner_admin_todo_ejercicios" on ejercicios for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin')));

create policy "alumno_ver_ejercicios" on ejercicios for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'alumno'));

-- ── ASIGNACIONES RUTINAS (legacy) ────────────────────────────
create policy "owner_todo_asignaciones" on asignaciones_rutinas for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_asignaciones" on asignaciones_rutinas for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_sus_asignaciones" on asignaciones_rutinas for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── SESIONES ─────────────────────────────────────────────────
create policy "owner_todo_sesiones" on sesiones for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_sesiones" on sesiones for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_sus_sesiones" on sesiones for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── PAGOS ────────────────────────────────────────────────────
create policy "owner_todo_pagos" on pagos for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_pagos" on pagos for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_sus_pagos" on pagos for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── MENSAJES ─────────────────────────────────────────────────
create policy "owner_todo_mensajes" on mensajes for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_mensajes" on mensajes for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_sus_mensajes" on mensajes for all
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── PROGRESO PESO ────────────────────────────────────────────
create policy "owner_todo_progreso" on progreso_peso for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_su_progreso" on progreso_peso for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_su_progreso" on progreso_peso for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── RECETAS ──────────────────────────────────────────────────
create policy "owner_admin_todo_recetas" on recetas for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin')));

create policy "alumno_ver_recetas_activas" on recetas for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'alumno')
    and activa = true
  );

-- ── CATÁLOGO DE EJERCICIOS ───────────────────────────────────
create policy "owner_admin_catalogo" on catalogo_ejercicios for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin')));

create policy "alumno_ver_catalogo" on catalogo_ejercicios for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'alumno'));

-- ── RUTINA EJERCICIOS ────────────────────────────────────────
create policy "owner_todo_rutina_ejercicios" on rutina_ejercicios for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_rutina_ejercicios" on rutina_ejercicios for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_su_rutina" on rutina_ejercicios for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── RUTINA DESCANSOS ─────────────────────────────────────────
create policy "owner_todo_descansos" on rutina_descansos for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "admin_sus_descansos" on rutina_descansos for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    and exists (select 1 from alumnas where id = alumna_id and instructor_id = auth.uid())
  );

create policy "alumno_sus_descansos" on rutina_descansos for select
  using (exists (select 1 from alumnas where id = alumna_id and user_id = auth.uid()));

-- ── STORAGE BUCKETS ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('fotos-dorita', 'fotos-dorita', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('recetas-pdf', 'recetas-pdf', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ejercicios-fotos', 'ejercicios-fotos', true)
on conflict (id) do nothing;

-- Fotos alumnas: cualquier autenticado puede subir y ver
create policy "fotos_subir" on storage.objects for insert
  with check (bucket_id = 'fotos-dorita' and auth.uid() is not null);

create policy "fotos_ver" on storage.objects for select
  using (bucket_id = 'fotos-dorita');

-- Recetas PDF: solo owner/admin suben, cualquier autenticado descarga
create policy "recetas_subir" on storage.objects for insert
  with check (
    bucket_id = 'recetas-pdf'
    and exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin'))
  );

create policy "recetas_descargar" on storage.objects for select
  using (bucket_id = 'recetas-pdf' and auth.uid() is not null);

-- Fotos ejercicios catálogo: solo owner/admin suben, todos ven
create policy "ejercicios_fotos_subir" on storage.objects for insert
  with check (
    bucket_id = 'ejercicios-fotos'
    and exists (select 1 from profiles where id = auth.uid() and role in ('owner','admin'))
  );

create policy "ejercicios_fotos_ver" on storage.objects for select
  using (bucket_id = 'ejercicios-fotos');

-- ── DATOS DE EJEMPLO ─────────────────────────────────────────
insert into rutinas (nombre, descripcion, nivel, duracion_min, categoria) values
  ('Fuerza & Confianza', 'Rutina de fuerza para tonificar y ganar seguridad', 'Avanzado', 45, 'Fuerza'),
  ('Piernas de acero',   'Enfocada en cuádriceps, glúteos y pantorrillas',    'Intermedio', 50, 'Tren inferior'),
  ('Full Body Burn',     'Entrenamiento completo para quemar grasa',           'Principiante', 40, 'Full Body')
on conflict do nothing;