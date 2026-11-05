// El semáforo: cruza las reglas con lo que cada persona ya se hizo.
// 🔴 rojo: nunca registrado (y ya le corresponde) o vencido.
// 🟡 amarillo: vence dentro de los próximos 3 meses.
// 🟢 verde: al día.
import type { ControlRealizado, Regla } from "@/lib/controles";

export type Estado = "rojo" | "amarillo" | "verde";

export type ItemSemaforo = {
  regla: Regla; // la regla principal (ej.: SOMFi)
  opciones: Regla[]; // la principal + sus alternativas (ej.: colonoscopía)
  ultimo: ControlRealizado | null; // el registro que cuenta para el vencimiento
  historial: ControlRealizado[];
  estado: Estado;
  vence: string | null; // AAAA-MM-DD, null si es "una sola vez"
};

const AVISO_MESES = 3;

type Persona = { fecha_nacimiento: string; sexo: "F" | "M"; tabaco: string | null };

export function edadEnMeses(fechaNacimiento: string, hoy: string) {
  const [an, mn, dn] = fechaNacimiento.split("-").map(Number);
  const [ah, mh, dh] = hoy.split("-").map(Number);
  let meses = (ah - an) * 12 + (mh - mn);
  if (dh < dn) meses--;
  return meses;
}

export function sumarMeses(fecha: string, meses: number) {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1 + meses, 1));
  // Si el día no existe en ese mes (31 de febrero), usamos el último día del mes.
  const ultimoDia = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate();
  f.setUTCDate(Math.min(d, ultimoDia));
  return f.toISOString().slice(0, 10);
}

export function leCorresponde(regla: Regla, persona: Persona, edadMeses: number) {
  if (regla.sexo && regla.sexo !== persona.sexo) return false;
  if (regla.requiere_tabaco && !(persona.tabaco && regla.requiere_tabaco.includes(persona.tabaco))) return false;
  if (edadMeses < regla.edad_desde_meses) return false;
  if (regla.edad_hasta_meses !== null && edadMeses > regla.edad_hasta_meses) return false;
  return true;
}

export function calcularSemaforo(
  persona: Persona,
  reglas: Regla[],
  controles: ControlRealizado[], // solo los de esta persona
  hoy: string,
): ItemSemaforo[] {
  const edad = edadEnMeses(persona.fecha_nacimiento, hoy);
  const aplican = reglas.filter((r) => leCorresponde(r, persona, edad));
  const items: ItemSemaforo[] = [];

  for (const regla of aplican) {
    if (regla.alternativa_de) continue; // las alternativas van dentro de su regla principal
    const opciones = [regla, ...aplican.filter((r) => r.alternativa_de === regla.id)];
    const ids = new Set(opciones.map((o) => o.id));
    const historial = controles.filter((c) => ids.has(c.regla_id)).sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Cuenta el registro que cubre más tiempo (una colonoscopía cubre más que una SOMFi).
    let ultimo: ControlRealizado | null = null;
    let vence: string | null = null;
    let unaVezHecha = false;
    for (const c of historial) {
      const r = opciones.find((o) => o.id === c.regla_id)!;
      if (r.intervalo_meses === 0) {
        unaVezHecha = true;
        ultimo ??= c;
        continue;
      }
      const v = sumarMeses(c.fecha, r.intervalo_meses);
      if (!vence || v > vence) {
        vence = v;
        ultimo = c;
      }
    }

    let estado: Estado;
    if (unaVezHecha && !vence) estado = "verde";
    else if (!vence) estado = "rojo";
    else if (hoy > vence) estado = "rojo";
    else if (hoy >= sumarMeses(vence, -AVISO_MESES)) estado = "amarillo";
    else estado = "verde";

    items.push({ regla, opciones, ultimo, historial, estado, vence: unaVezHecha && !vence ? null : vence });
  }

  const orden: Record<Estado, number> = { rojo: 0, amarillo: 1, verde: 2 };
  return items.sort((a, b) => orden[a.estado] - orden[b.estado] || a.regla.id.localeCompare(b.regla.id));
}

export function contar(items: ItemSemaforo[]) {
  return {
    rojo: items.filter((i) => i.estado === "rojo").length,
    amarillo: items.filter((i) => i.estado === "amarillo").length,
    verde: items.filter((i) => i.estado === "verde").length,
  };
}

// Fecha de hoy en Argentina, como AAAA-MM-DD.
export function hoyAR() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function fechaCorta(fecha: string) {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}
