// Textos y cálculos que usan varias pantallas.

export const PARENTESCO = { yo: "vos", pareja: "pareja", hijo: "hijo/a", padre: "padre", madre: "madre" } as const;

// Edad en años (o en meses para menores de 2).
export function edad(fecha: string) {
  const nac = new Date(`${fecha}T00:00:00`);
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + hoy.getMonth() - nac.getMonth();
  if (hoy.getDate() < nac.getDate()) meses--;
  if (meses < 24) return `${Math.max(meses, 0)} ${meses === 1 ? "mes" : "meses"}`;
  return `${Math.floor(meses / 12)} años`;
}

// Agrupa a la familia con rótulo y en este orden: vos, pareja, hijos, padres.
// Dentro de cada grupo, de mayor a menor.
type ConParentesco = { parentesco: keyof typeof PARENTESCO; fecha_nacimiento: string };

const GRUPOS = [
  { rotulo: "Vos", parentescos: ["yo"] },
  { rotulo: "Pareja", parentescos: ["pareja"] },
  { rotulo: "Hijos", parentescos: ["hijo"] },
  { rotulo: "Padres", parentescos: ["madre", "padre"] },
] as const;

export function agruparFamilia<T extends ConParentesco>(integrantes: T[]) {
  return GRUPOS.map((g) => ({
    rotulo: g.rotulo,
    integrantes: integrantes
      .filter((i) => (g.parentescos as readonly string[]).includes(i.parentesco))
      .sort((a, b) => a.fecha_nacimiento.localeCompare(b.fecha_nacimiento)),
  })).filter((g) => g.integrantes.length > 0);
}
