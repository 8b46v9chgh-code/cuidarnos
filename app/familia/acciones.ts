"use server";

// Agregar, editar y borrar integrantes de la familia.
// La seguridad (RLS) de Supabase impide tocar integrantes de otra familia.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { obtenerFamilia } from "@/lib/familia";
import { texto, validarBasicos } from "@/lib/validacion";

export type EstadoIntegrante = { error: string | null };

const PARENTESCOS = ["pareja", "hijo", "padre", "madre"];

export async function guardarIntegrante(
  _anterior: EstadoIntegrante,
  formData: FormData,
): Promise<EstadoIntegrante> {
  const basicos = validarBasicos(formData, "otro");
  if ("error" in basicos) return { error: basicos.error };

  const parentesco = texto(formData, "parentesco");
  if (!PARENTESCOS.includes(parentesco)) return { error: "Elegí el parentesco." };

  const familia = await obtenerFamilia();
  if (!familia) redirect("/registro");

  const datos = {
    nombre: basicos.nombre,
    fecha_nacimiento: basicos.fechaNacimiento,
    sexo: basicos.sexo,
    parentesco,
    a_cargo: formData.get("a_cargo") === "on",
  };

  const supabase = await createClient();
  const id = texto(formData, "id");

  const { error } = id
    ? // Editar: nunca al administrador desde acá (sus datos son los del registro).
      await supabase.from("integrantes").update(datos).eq("id", id).eq("es_administrador", false)
    : await supabase.from("integrantes").insert({ ...datos, familia_id: familia.id });

  if (error) return { error: "No pudimos guardar. Probá de nuevo en un rato." };
  redirect("/familia");
}

export async function borrarIntegrante(formData: FormData) {
  const id = texto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  // El administrador no se puede borrar a sí mismo.
  await supabase.from("integrantes").delete().eq("id", id).eq("es_administrador", false);
  redirect("/familia");
}
