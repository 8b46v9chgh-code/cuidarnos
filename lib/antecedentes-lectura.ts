// Lectura de los antecedentes de la familia (servidor).
// La seguridad (RLS) ya filtra: cada administrador ve solo los de su familia.
import { createClient } from "@/lib/supabase/server";
import type { Antecedente } from "@/lib/antecedentes";

export async function obtenerAntecedentes(): Promise<Antecedente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("antecedentes")
    .select("id, integrante_id, parentesco, lado, enfermedad, organo, tipo_diabetes, sindrome, edad_respuesta, edad_corte, detalle")
    .order("created_at");
  if (error) throw new Error(`No se pudieron leer los antecedentes: ${error.message}`);
  return data as Antecedente[];
}
