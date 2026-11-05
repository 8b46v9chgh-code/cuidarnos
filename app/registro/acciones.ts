"use server";

// Guarda el registro: crea la familia y al administrador como primer integrante ("yo").
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoRegistro = { error: string | null };

export async function registrarse(
  _anterior: EstadoRegistro,
  formData: FormData,
): Promise<EstadoRegistro> {
  const datos = leerFormulario(formData);
  if ("error" in datos) return { error: datos.error ?? "Revisá los datos." };

  const supabase = await createClient();

  // 1. La familia. administrador_id lo completa la base sola con el usuario que inició sesión.
  const { data: familia, error: errorFamilia } = await supabase
    .from("familias")
    .insert({ acepta_avisos: datos.aceptaAvisos })
    .select("id")
    .single();

  if (errorFamilia) {
    // El índice "unique" de administrador_id impide una segunda familia: ya estaba registrado.
    if (errorFamilia.code === "23505") redirect("/");
    return { error: "No pudimos guardar tus datos. Probá de nuevo en un rato." };
  }

  // 2. El administrador como primer integrante.
  const { error: errorIntegrante } = await supabase.from("integrantes").insert({
    familia_id: familia.id,
    nombre: datos.nombre,
    fecha_nacimiento: datos.fechaNacimiento,
    sexo: datos.sexo,
    parentesco: "yo",
    a_cargo: true,
    es_administrador: true,
    peso_kg: datos.peso,
    altura_cm: datos.altura,
    cintura_cm: datos.cintura,
    tabaco: datos.tabaco,
    actividad: datos.actividad,
  });

  if (errorIntegrante) {
    // Si falló, borramos la familia recién creada para no dejar una a medias.
    await supabase.from("familias").delete().eq("id", familia.id);
    return { error: "No pudimos guardar tus datos. Probá de nuevo en un rato." };
  }

  redirect("/");
}

// Revisa lo que mandó el formulario. Repite las reglas de la base para dar mensajes claros.
function leerFormulario(f: FormData) {
  const texto = (k: string) => String(f.get(k) ?? "").trim();
  const numero = (k: string) => {
    const v = texto(k).replace(",", ".");
    return v === "" ? null : Number(v);
  };

  const nombre = texto("nombre");
  const fechaNacimiento = texto("fecha_nacimiento");
  const sexo = texto("sexo");
  const peso = numero("peso_kg");
  const altura = numero("altura_cm");
  const cintura = numero("cintura_cm");
  const tabaco = texto("tabaco") || null;
  const actividad = texto("actividad") || null;

  if (nombre.length < 1 || nombre.length > 60) return { error: "Poné tu nombre (hasta 60 letras)." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) || fechaNacimiento < "1900-01-01" || new Date(fechaNacimiento) > new Date())
    return { error: "Revisá la fecha de nacimiento." };
  if (sexo !== "F" && sexo !== "M") return { error: "Elegí el sexo." };
  if (peso !== null && !(peso > 0 && peso < 400)) return { error: "Revisá el peso (en kg)." };
  if (altura !== null && !(altura > 30 && altura < 250)) return { error: "Revisá la altura (en cm)." };
  if (cintura !== null && !(cintura > 20 && cintura < 250)) return { error: "Revisá la cintura (en cm)." };
  if (tabaco && !["nunca", "ex", "actual"].includes(tabaco)) return { error: "Revisá lo del tabaco." };
  if (actividad && !["poca", "moderada", "mucha"].includes(actividad))
    return { error: "Revisá la actividad física." };

  return {
    nombre,
    fechaNacimiento,
    sexo,
    peso,
    altura,
    cintura,
    tabaco,
    actividad,
    aceptaAvisos: f.get("acepta_avisos") === "on",
  };
}
