// Lectura de la familia del usuario que inició sesión.
// La seguridad (RLS) de Supabase ya filtra: cada administrador solo ve su familia.
import { createClient } from "@/lib/supabase/server";

export type Integrante = {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: "F" | "M";
  parentesco: "yo" | "pareja" | "hijo" | "padre" | "madre" | "otro";
  parentesco_detalle: string | null;
  a_cargo: boolean;
  tabaco: "nunca" | "ex" | "actual" | null;
  es_administrador: boolean;
};

export async function obtenerFamilia() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("familias")
    .select(
      "id, nombre, integrantes (id, nombre, fecha_nacimiento, sexo, parentesco, parentesco_detalle, a_cargo, es_administrador, tabaco)",
    )
    .maybeSingle();

  if (error) throw new Error(`No se pudo leer la familia: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id as string,
    nombre: data.nombre as string,
    integrantes: (data.integrantes ?? []) as Integrante[],
  };
}
