// Reglas compartidas para los datos de una persona.
// Repiten las de la base de datos para poder dar mensajes claros en castellano.

export function texto(f: FormData, k: string) {
  return String(f.get(k) ?? "").trim();
}

export type Basicos = { nombre: string; fechaNacimiento: string; sexo: "F" | "M" };

export function validarBasicos(f: FormData, quien: "vos" | "otro"): Basicos | { error: string } {
  const nombre = texto(f, "nombre");
  const fechaNacimiento = texto(f, "fecha_nacimiento");
  const sexo = texto(f, "sexo");

  if (nombre.length < 1 || nombre.length > 60)
    return { error: quien === "vos" ? "Poné tu nombre (hasta 60 letras)." : "Poné el nombre (hasta 60 letras)." };
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) ||
    fechaNacimiento < "1900-01-01" ||
    new Date(`${fechaNacimiento}T00:00:00`) > new Date()
  )
    return { error: "Revisá la fecha de nacimiento." };
  if (sexo !== "F" && sexo !== "M") return { error: "Elegí el sexo." };

  return { nombre, fechaNacimiento, sexo };
}
