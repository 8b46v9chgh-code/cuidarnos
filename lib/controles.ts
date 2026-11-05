// Reglas de prevención y controles realizados (lectura).
import { createClient } from "@/lib/supabase/server";

export type Regla = {
  id: string;
  area: string;
  tipo: "estudio" | "vacuna" | "charla";
  control: string;
  sexo: "F" | "M" | null;
  edad_desde_meses: number;
  edad_hasta_meses: number | null;
  intervalo_meses: number;
  requiere_tabaco: string[] | null;
  alternativa_de: string | null;
};

export type ControlRealizado = {
  id: string;
  integrante_id: string;
  regla_id: string;
  fecha: string;
  informe_path: string | null;
};

export async function obtenerReglas(): Promise<Regla[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reglas")
    .select("id, area, tipo, control, sexo, edad_desde_meses, edad_hasta_meses, intervalo_meses, requiere_tabaco, alternativa_de")
    .eq("activa", true)
    .order("id");
  if (error) throw new Error(`No se pudieron leer las reglas: ${error.message}`);
  return data as Regla[];
}

export async function obtenerControlesRealizados(): Promise<ControlRealizado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("controles_realizados")
    .select("id, integrante_id, regla_id, fecha, informe_path")
    .order("fecha", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los controles: ${error.message}`);
  return data as ControlRealizado[];
}
