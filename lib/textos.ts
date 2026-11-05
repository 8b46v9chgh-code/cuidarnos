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
