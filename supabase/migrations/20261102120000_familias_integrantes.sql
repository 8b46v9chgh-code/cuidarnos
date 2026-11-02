-- Migración 1: familias e integrantes
-- Una familia tiene un administrador (el usuario que inició sesión)
-- y varios integrantes, incluido el propio administrador.

-- ─────────────────────────────────────────────
-- Familias
-- ─────────────────────────────────────────────
create table public.familias (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null default 'Mi familia',
  -- Quién administra la familia. Por defecto, el usuario que la crea.
  administrador_id uuid not null unique default auth.uid()
                   references auth.users (id) on delete cascade,
  -- Respuesta a "¿Querés recibir información sobre los controles de tu familia?"
  acepta_avisos    boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Integrantes
-- ─────────────────────────────────────────────
create table public.integrantes (
  id               uuid primary key default gen_random_uuid(),
  familia_id       uuid not null references public.familias (id) on delete cascade,
  nombre           text not null check (length(trim(nombre)) between 1 and 60),
  -- Fecha y no edad: la edad se calcula sola y sirve para los meses de los bebés.
  fecha_nacimiento date not null check (fecha_nacimiento >= date '1900-01-01'),
  sexo             text not null check (sexo in ('F', 'M')),
  parentesco       text not null check (parentesco in ('yo', 'pareja', 'hijo', 'padre', 'madre')),
  -- "A cargo": el administrador recibe sus avisos y anota sus estudios.
  a_cargo          boolean not null default true,
  es_administrador boolean not null default false,
  -- Medidas y hábitos: opcionales, se completan cuando se saben.
  peso_kg          numeric(5,1) check (peso_kg > 0 and peso_kg < 400),
  altura_cm        numeric(5,1) check (altura_cm > 30 and altura_cm < 250),
  cintura_cm       numeric(5,1) check (cintura_cm > 20 and cintura_cm < 250),
  tabaco           text check (tabaco in ('nunca', 'ex', 'actual')),
  actividad        text check (actividad in ('poca', 'moderada', 'mucha')),
  created_at       timestamptz not null default now()
);

create index integrantes_familia_id_idx on public.integrantes (familia_id);

-- Un solo integrante marcado como administrador por familia.
create unique index integrantes_un_admin_por_familia
  on public.integrantes (familia_id) where es_administrador;

-- ─────────────────────────────────────────────
-- Seguridad (RLS): cada administrador ve y edita solo su familia
-- ─────────────────────────────────────────────
alter table public.familias    enable row level security;
alter table public.integrantes enable row level security;

create policy "El administrador maneja su familia"
  on public.familias for all
  to authenticated
  using (administrador_id = (select auth.uid()))
  with check (administrador_id = (select auth.uid()));

create policy "El administrador maneja a sus integrantes"
  on public.integrantes for all
  to authenticated
  using (
    exists (
      select 1 from public.familias f
      where f.id = familia_id
        and f.administrador_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.familias f
      where f.id = familia_id
        and f.administrador_id = (select auth.uid())
    )
  );
