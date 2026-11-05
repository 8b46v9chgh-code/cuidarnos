-- Migración 4: "Ya me lo hice" — controles realizados e informes
-- Cada fila: quién (integrante), qué (regla), cuándo (fecha) y, opcional, el informe subido.

create table if not exists public.controles_realizados (
  id             uuid primary key default gen_random_uuid(),
  integrante_id  uuid not null references public.integrantes (id) on delete cascade,
  regla_id       text not null references public.reglas (id),
  fecha          date not null check (fecha >= date '1900-01-01'),
  -- Ruta del archivo en Storage (bucket "informes"): <familia_id>/<integrante_id>/<archivo>
  informe_path   text,
  created_at     timestamptz not null default now()
);

create index if not exists controles_realizados_integrante_idx
  on public.controles_realizados (integrante_id, regla_id, fecha desc);

-- Seguridad: el administrador ve y maneja solo los controles de su familia.
alter table public.controles_realizados enable row level security;
drop policy if exists "El administrador maneja los controles de su familia" on public.controles_realizados;
create policy "El administrador maneja los controles de su familia"
  on public.controles_realizados for all
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

-- ─────────────────────────────────────────────
-- Storage: bucket PRIVADO para los informes (PDF o fotos, hasta 10 MB)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('informes', 'informes', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- La primera carpeta del archivo es el id de la familia: solo su administrador la toca.
drop policy if exists "informes: el administrador lee los de su familia" on storage.objects;
create policy "informes: el administrador lee los de su familia"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'informes'
    and (storage.foldername(name))[1] in (
      select id::text from public.familias where administrador_id = (select auth.uid())
    )
  );

drop policy if exists "informes: el administrador sube a su familia" on storage.objects;
create policy "informes: el administrador sube a su familia"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'informes'
    and (storage.foldername(name))[1] in (
      select id::text from public.familias where administrador_id = (select auth.uid())
    )
  );

drop policy if exists "informes: el administrador borra los de su familia" on storage.objects;
create policy "informes: el administrador borra los de su familia"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'informes'
    and (storage.foldername(name))[1] in (
      select id::text from public.familias where administrador_id = (select auth.uid())
    )
  );

-- Verificación
select 'tabla' as que, count(*)::text as valor from information_schema.tables
  where table_schema = 'public' and table_name = 'controles_realizados'
union all
select 'bucket privado', (select (not public)::text from storage.buckets where id = 'informes')
union all
select 'politicas storage', count(*)::text from pg_policies
  where schemaname = 'storage' and tablename = 'objects' and policyname like 'informes:%';
