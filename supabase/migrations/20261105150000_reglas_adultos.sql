-- Migración 3: reglas de prevención (adultos)
-- Las reglas viven en la base, no en el código: cambiar un intervalo es editar una fila.
-- Edades en MESES para que adultos y chicos usen la misma tabla.
-- edad_hasta_meses es inclusiva: "hasta 75 años" = hasta 75*12+11 meses (el último mes con 75).

create table if not exists public.reglas (
  id                text primary key,                     -- "CV-01", igual que en la planilla
  area              text not null check (area in ('cardiovascular','diabetes','peso','cancer','oseo','vacunas','otros')),
  tipo              text not null check (tipo in ('estudio','vacuna','charla')),
  control           text not null,
  sexo              text check (sexo in ('F','M')),       -- null = todos
  edad_desde_meses  int  not null check (edad_desde_meses >= 0),
  edad_hasta_meses  int  check (edad_hasta_meses is null or edad_hasta_meses >= edad_desde_meses), -- null = sin tope
  intervalo_meses   int  not null default 0 check (intervalo_meses >= 0), -- 0 = una sola vez
  condicion         text,                                 -- texto para mostrar
  requiere_tabaco   text[],                               -- si no es null, solo aplica con esos valores de "tabaco"
  alternativa_de    text references public.reglas (id),   -- ej.: colonoscopía reemplaza a SOMFi
  antecedente       text,                                 -- qué antecedente la modifica (texto, por ahora)
  modificacion      text,                                 -- cómo la modifica (texto, por ahora)
  fuente            text,
  activa            boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Seguridad: cualquier usuario con sesión puede LEER las reglas. Nadie las edita desde la app.
alter table public.reglas enable row level security;
drop policy if exists "Las reglas las lee cualquier usuario con sesion" on public.reglas;
create policy "Las reglas las lee cualquier usuario con sesion"
  on public.reglas for select
  to authenticated
  using (true);

-- Carga (re-ejecutable: si la fila existe, la actualiza). Primero sin alternativa_de, por el orden.
insert into public.reglas
  (id, area, tipo, control, sexo, edad_desde_meses, edad_hasta_meses, intervalo_meses, condicion, requiere_tabaco, alternativa_de, antecedente, modificacion, fuente)
values
  ('CV-01', 'cardiovascular', 'estudio', 'Toma de presión arterial', null, 216, 479, 36, 'Sin factores de riesgo', null, null, 'Factor de riesgo CV o PA limítrofe', 'Pasa a cada 12 meses', 'Práctica preventiva habitual – a definir guía de referencia'),
  ('CV-02', 'cardiovascular', 'estudio', 'Toma de presión arterial', null, 480, null, 12, 'Todos', null, null, null, null, 'Práctica preventiva habitual – a definir guía de referencia'),
  ('CV-03', 'cardiovascular', 'estudio', 'Perfil lipídico', null, 480, 911, 60, 'Todos', null, null, 'Familiar 1° grado con enfermedad CV precoz (V<55 / M<65)', 'Iniciar a los 20 años', 'Práctica preventiva habitual – a definir guía de referencia'),
  ('CV-04', 'cardiovascular', 'charla', 'Consejería tabaquismo', null, 216, null, 12, 'Fumador/a actual', array['actual'], null, null, null, 'Práctica preventiva habitual – a definir guía de referencia'),
  ('CV-05', 'cardiovascular', 'estudio', 'Ecografía de aorta abdominal', 'M', 780, 911, 0, 'Fumador o ex fumador', array['actual','ex'], null, null, null, 'USPSTF (no hay programa nacional en AR)'),
  ('DM-01', 'diabetes', 'estudio', 'Glucemia en ayunas', null, 540, null, 36, 'Todos', null, null, 'IMC ≥25 + otro factor (familiar 1° con DBT, sedentarismo, cintura aumentada)', 'Iniciar a los 35 años', 'Práctica preventiva habitual – a definir guía de referencia'),
  ('PE-01', 'peso', 'estudio', 'IMC y perímetro de cintura', null, 216, null, 12, 'Todos', null, null, null, null, 'Práctica preventiva habitual – a definir guía de referencia'),
  ('CA-01', 'cancer', 'estudio', 'Mamografía', 'F', 600, 839, 24, 'Riesgo promedio', null, null, 'Familiar 1° grado con cáncer de mama', 'Iniciar antes (p. ej. 40 años o 10 años antes del caso) y derivar a especialista', 'INC – Programa Nacional de Cáncer de Mama'),
  ('CA-02', 'cancer', 'estudio', 'Papanicolaou (PAP)', 'F', 300, 359, 36, 'Tras 2 PAP anuales negativos', null, null, null, null, 'INC – Programa Nacional Prevención Cáncer Cervicouterino'),
  ('CA-03', 'cancer', 'estudio', 'Test de VPH', 'F', 360, 779, 60, 'Si el test previo fue negativo', null, null, null, null, 'INC – Programa Nacional Prevención Cáncer Cervicouterino'),
  ('CA-04', 'cancer', 'estudio', 'Sangre oculta en materia fecal inmunológica (SOMFi)', null, 600, 911, 24, 'Riesgo promedio', null, null, 'Familiar 1° grado con cáncer colorrectal o pólipos avanzados', 'Reemplazar por colonoscopía desde los 40 años (o 10 años antes del caso), cada 5 años', 'INC 2022 – Recomendaciones tamizaje organizado CCR'),
  ('CA-05', 'cancer', 'estudio', 'Colonoscopía (alternativa a SOMFi)', null, 600, 911, 120, 'Riesgo promedio, si se elige este método', null, null, 'Ver CA-04', null, 'A confirmar'),
  ('CA-06', 'cancer', 'charla', 'PSA – decisión compartida', 'M', 660, 839, 24, 'Charlar beneficios y riesgos con médico', null, null, 'Familiar 1° grado con cáncer de próstata', 'Iniciar la charla a los 45-50', 'USPSTF (no hay programa nacional en AR)'),
  ('CA-07', 'cancer', 'estudio', 'TC de tórax de baja dosis', null, 600, 971, 12, '≥20 paquetes-año, fumador o dejó hace <15 años', array['actual','ex'], null, null, null, 'USPSTF (no hay programa nacional en AR)'),
  ('OS-01', 'oseo', 'estudio', 'Densitometría ósea', 'F', 780, null, 0, 'Todas', null, null, 'Menopausia con factores de riesgo (bajo peso, fractura previa, corticoides)', 'Hacer antes de los 65', 'Práctica preventiva habitual – a definir guía de referencia'),
  ('VA-01', 'vacunas', 'vacuna', 'Doble bacteriana (dT)', null, 216, null, 120, 'Todos', null, null, null, null, 'Calendario Nacional de Vacunación 2026 (MSAL)'),
  ('VA-02', 'vacunas', 'vacuna', 'Antigripal', null, 780, null, 12, 'Todos', null, null, 'Factores de riesgo / embarazo / personal de salud', 'Indicada a cualquier edad', 'Calendario Nacional de Vacunación 2026 (MSAL)'),
  ('VA-03', 'vacunas', 'vacuna', 'Neumococo', null, 780, null, 0, 'Dosis única según calendario vigente', null, null, 'Factores de riesgo', 'Indicada antes de los 65', 'Calendario Nacional de Vacunación 2026 (MSAL)'),
  ('VA-04', 'vacunas', 'vacuna', 'Hepatitis B', null, 216, null, 0, 'Sin esquema completo (3 dosis)', null, null, null, null, 'Calendario Nacional de Vacunación 2026 (MSAL)'),
  ('VA-05', 'vacunas', 'vacuna', 'Triple viral', null, 216, null, 0, 'Nacidos después de 1965 sin 2 dosis documentadas', null, null, null, null, 'Calendario Nacional de Vacunación 2026 (MSAL)'),
  ('IN-01', 'otros', 'estudio', 'Serologías VIH y hepatitis C', null, 216, null, 0, 'Al menos una vez en la vida', null, null, 'Conductas de riesgo', 'Repetir según riesgo', 'Práctica preventiva habitual – a definir guía de referencia')
on conflict (id) do update set
  area = excluded.area, tipo = excluded.tipo, control = excluded.control, sexo = excluded.sexo,
  edad_desde_meses = excluded.edad_desde_meses, edad_hasta_meses = excluded.edad_hasta_meses,
  intervalo_meses = excluded.intervalo_meses, condicion = excluded.condicion,
  requiere_tabaco = excluded.requiere_tabaco, antecedente = excluded.antecedente,
  modificacion = excluded.modificacion, fuente = excluded.fuente;

update public.reglas set alternativa_de = 'CA-04' where id = 'CA-05';

-- Verificación
select id, area, tipo, sexo, edad_desde_meses / 12 as desde_anios, edad_hasta_meses / 12 as hasta_anios, intervalo_meses
from public.reglas order by id;
