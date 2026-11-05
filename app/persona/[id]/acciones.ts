"use server";

// Guardar y borrar controles realizados ("Ya me lo hice").
// El archivo del informe lo sube el navegador directo a Storage; acá solo se guarda su ruta.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { texto } from "@/lib/validacion";

export type EstadoControl = { error: string | null };

export async function guardarControl(_anterior: EstadoControl, formData: FormData): Promise<EstadoControl> {
  const integranteId = texto(formData, "integrante_id");
  const reglaId = texto(formData, "regla_id");
  const fecha = texto(formData, "fecha");
  const informePath = texto(formData, "informe_path") || null;

  const supabase = await createClient();
  // Si algo sale mal, borramos el archivo que ya se subió para no dejarlo huérfano.
  const fallar = async (error: string) => {
    if (informePath) await supabase.storage.from("informes").remove([informePath]);
    return { error };
  };

  if (!integranteId) return fallar("Elegí de quién es el control.");
  if (!reglaId) return fallar("Elegí qué control se hizo.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < "1900-01-01" || new Date(`${fecha}T00:00:00`) > new Date())
    return fallar("Revisá la fecha: no puede ser futura.");
  // La ruta del archivo tiene que estar dentro de la carpeta de ese integrante.
  if (informePath && informePath.split("/")[1] !== integranteId) return fallar("El informe no corresponde.");

  const { error } = await supabase.from("controles_realizados").insert({
    integrante_id: integranteId,
    regla_id: reglaId,
    fecha,
    informe_path: informePath,
  });
  if (error) return fallar("No pudimos guardar. Probá de nuevo en un rato.");

  redirect(`/persona/${integranteId}?listo=1`);
}

export async function borrarControl(formData: FormData) {
  const id = texto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("controles_realizados")
    .select("informe_path, integrante_id")
    .eq("id", id)
    .maybeSingle();
  await supabase.from("controles_realizados").delete().eq("id", id);
  if (data?.informe_path) await supabase.storage.from("informes").remove([data.informe_path]);
  redirect(data ? `/persona/${data.integrante_id}` : "/");
}
