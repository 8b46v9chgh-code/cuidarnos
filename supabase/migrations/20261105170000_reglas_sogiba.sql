-- Migración 5: mama y cuello uterino según consensos firmados por SOGIBA (en vez del INC).
-- Mama: Consenso Nacional Inter-Sociedades sobre Tamizaje en Cáncer de Mama 2021 (SAM, SAR, SOGIBA, AMA y otras).
-- Cuello: Guía 2022 SAPTGIyC / SOGIBA / FASGO.

update public.reglas set
  edad_desde_meses = 40 * 12,
  edad_hasta_meses = null,
  intervalo_meses  = 12,
  condicion        = 'Riesgo promedio. Anual desde los 40, sin edad fija para dejar (mientras la expectativa de vida supere 5-7 años)',
  fuente           = 'Consenso Nacional Inter-Sociedades sobre Tamizaje en Cáncer de Mama 2021 (incluye SOGIBA)'
where id = 'CA-01';

update public.reglas set
  edad_desde_meses = 25 * 12,
  edad_hasta_meses = 29 * 12 + 11,
  intervalo_meses  = 12,
  condicion        = 'Anual; después de 2 PAP negativos seguidos, cada 3 años. Inicio real: 3 años después del inicio de relaciones sexuales',
  fuente           = 'Guía 2022 SAPTGIyC / SOGIBA / FASGO'
where id = 'CA-02';

update public.reglas set
  edad_desde_meses = 30 * 12,
  edad_hasta_meses = 65 * 12 + 11,
  intervalo_meses  = 60,
  condicion        = 'Test de VPH; si es negativo, repetir a los 5 años. Co-test (VPH + PAP) es opción',
  fuente           = 'Guía 2022 SAPTGIyC / SOGIBA / FASGO'
where id = 'CA-03';

-- Verificación
select id, control, edad_desde_meses / 12 as desde, edad_hasta_meses / 12 as hasta, intervalo_meses, fuente
from public.reglas where id in ('CA-01', 'CA-02', 'CA-03') order by id;
