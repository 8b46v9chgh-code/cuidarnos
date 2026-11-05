-- Migración 2: parentesco "otro" con aclaración en texto libre
-- (abuela, hermano, tía...). Para la prevención importan la edad y el sexo,
-- así que el parentesco exacto queda como texto que escribe el administrador.

alter table public.integrantes
  drop constraint if exists integrantes_parentesco_check;

alter table public.integrantes
  add constraint integrantes_parentesco_check
  check (parentesco in ('yo', 'pareja', 'hijo', 'padre', 'madre', 'otro'));

-- Opcional. Solo tiene sentido cuando parentesco = 'otro'.
alter table public.integrantes
  add column if not exists parentesco_detalle text
  check (parentesco_detalle is null or length(trim(parentesco_detalle)) between 1 and 30);
