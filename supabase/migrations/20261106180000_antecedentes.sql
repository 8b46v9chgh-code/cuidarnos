-- Migración 6: antecedentes familiares
-- Cada fila es un familiar de sangre enfermo, cargado como "familiar de" un integrante.
-- Ej.: "padre de Maxi, lado paterno, cáncer de colon, antes de los 60".
-- La app calcula el grado sola: el padre de Maxi es 1er grado para Maxi y 2do grado para sus hijos.
-- Las reglas médicas que usan estos datos viven en el código (lib/antecedentes.ts), no acá.

create table if not exists public.antecedentes (
  id             uuid primary key default gen_random_uuid(),
  -- De quién es familiar el enfermo (el parentesco se lee desde esta persona).
  integrante_id  uuid not null references public.integrantes (id) on delete cascade,
  parentesco     text not null check (parentesco in (
                   'padre', 'madre', 'hermano', 'hermana', 'hijo', 'hija',
                   'abuelo', 'abuela', 'tio', 'tia', 'otro')),
  -- Lado de la familia. En padre/madre se deduce solo; en hermanos e hijos no aplica.
  lado           text check (lado in ('paterno', 'materno')),
  enfermedad     text not null check (enfermedad in (
                   'cancer', 'diabetes', 'cardiovascular', 'colesterol',
                   'hipertension', 'tiroides', 'sindrome', 'otra')),
  -- Solo para cáncer: el órgano.
  organo         text check (organo in (
                   'prostata', 'colon', 'pulmon', 'rinon', 'estomago', 'vejiga',
                   'pancreas', 'melanoma', 'mama', 'cuello_utero', 'tiroides',
                   'endometrio', 'ovario', 'otro')),
  -- Solo para diabetes: tipo 1, tipo 2 o no sabe.
  tipo_diabetes  text check (tipo_diabetes in ('1', '2', 'no_se')),
  -- Solo para síndrome genético conocido.
  sindrome       text check (sindrome in (
                   'brca', 'lynch', 'paf', 'li_fraumeni', 'cowden', 'cdh1',
                   'peutz_jeghers', 'cdkn2a', 'no_se_nombre')),
  -- Edad al diagnóstico: no se pide exacta. Se guarda la respuesta a
  -- "¿tenía menos de X años?" y cuál fue ese X (depende de la enfermedad).
  -- 'no_se' se trata como 'antes' (el caso más joven).
  edad_respuesta text not null default 'no_se' check (edad_respuesta in ('antes', 'despues', 'no_se')),
  edad_corte     int check (edad_corte between 1 and 120),
  -- Texto libre: "otra" enfermedad, órgano "otro", o aclaraciones para el médico.
  detalle        text check (detalle is null or length(trim(detalle)) between 1 and 200),
  created_at     timestamptz not null default now(),

  -- Coherencia: cada dato extra solo con su enfermedad.
  constraint antecedentes_organo_solo_cancer   check ((enfermedad = 'cancer')   = (organo is not null)),
  constraint antecedentes_tipo_solo_diabetes   check ((enfermedad = 'diabetes') = (tipo_diabetes is not null)),
  constraint antecedentes_sindrome_solo_sindrome check ((enfermedad = 'sindrome') = (sindrome is not null))
);

create index if not exists antecedentes_integrante_idx on public.antecedentes (integrante_id);

-- Seguridad: igual que los controles, el administrador maneja solo los de su familia.
alter table public.antecedentes enable row level security;
drop policy if exists "El administrador maneja los antecedentes de su familia" on public.antecedentes;
create policy "El administrador maneja los antecedentes de su familia"
  on public.antecedentes for all
  to authenticated
  using (
    exists (
      select 1 from public.integrantes i
      join public.familias f on f.id = i.familia_id
      where i.id = integrante_id and f.administrador_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.integrantes i
      join public.familias f on f.id = i.familia_id
      where i.id = integrante_id and f.administrador_id = (select auth.uid())
    )
  );

-- Verificación
select 'tabla' as que, count(*)::text as valor from information_schema.tables
  where table_schema = 'public' and table_name = 'antecedentes'
union all
select 'rls activa', (select relrowsecurity::text from pg_class where oid = 'public.antecedentes'::regclass)
union all
select 'politicas', count(*)::text from pg_policies
  where schemaname = 'public' and tablename = 'antecedentes';
