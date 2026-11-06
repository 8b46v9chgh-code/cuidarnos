"use server";

// Guardar y borrar antecedentes familiares.
// Todo lo que llega del navegador se revisa acá: solo valores de las listas cerradas,
// y el corte de edad lo calcula el servidor (no se confía en el que mande la pantalla).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { texto } from "@/lib/validacion";
import { corteEdad, type Enfermedad, type Organo, type ParentescoFamiliar } from "@/lib/antecedentes";
import { ENFERMEDADES, PARENTESCOS, SINDROMES, TIPOS_DIABETES, organosPara, preguntaEdad, preguntaLado } from "@/lib/antecedentes-textos";

export type EstadoAntecedente = { error: string | null };

const valores = <T extends string>(lista: [T, string][]) => lista.map(([v]) => v);

export async function guardarAntecedente(_anterior: EstadoAntecedente, formData: FormData): Promise<EstadoAntecedente> {
  const integranteId = texto(formData, "integrante_id");
  const parentesco = texto(formData, "parentesco") as ParentescoFamiliar;
  const enfermedad = texto(formData, "enfermedad") as Enfermedad;
  const ladoElegido = texto(formData, "lado");
  const organoElegido = texto(formData, "organo");
  const tipoElegido = texto(formData, "tipo_diabetes");
  const sindromeElegido = texto(formData, "sindrome");
  const edadElegida = texto(formData, "edad_respuesta");
  const detalle = texto(formData, "detalle").slice(0, 200) || null;

  if (!integranteId) return { error: "Falta de quién es el antecedente." };
  if (!valores(PARENTESCOS).includes(parentesco)) return { error: "Elegí quién de la familia lo tuvo." };
  if (!valores(ENFERMEDADES).includes(enfermedad)) return { error: "Elegí qué tuvo." };

  // Lado: solo para abuelos, tíos y "otro". Vacío = no sabe.
  const lado = preguntaLado(parentesco) && (ladoElegido === "paterno" || ladoElegido === "materno") ? ladoElegido : null;

  let organo: Organo | null = null;
  if (enfermedad === "cancer") {
    if (!valores(organosPara(parentesco)).includes(organoElegido as Organo)) return { error: "Elegí de qué órgano fue el cáncer." };
    organo = organoElegido as Organo;
  }

  let tipoDiabetes: string | null = null;
  if (enfermedad === "diabetes") {
    if (!valores(TIPOS_DIABETES).includes(tipoElegido as "1" | "2" | "no_se")) return { error: "Elegí el tipo de diabetes (o \"No sé\")." };
    tipoDiabetes = tipoElegido;
  }

  let sindrome: string | null = null;
  if (enfermedad === "sindrome") {
    if (!valores(SINDROMES).includes(sindromeElegido as never)) return { error: "Elegí el síndrome (o \"Sé que hay uno, pero no el nombre\")." };
    sindrome = sindromeElegido;
  }

  if ((enfermedad === "otra" || organo === "otro") && !detalle) return { error: "Contanos cuál fue, en el campo de aclaración." };

  // Edad: solo para cáncer e infarto. "No sé" se guarda tal cual y la lógica lo toma como joven.
  let edadRespuesta = "no_se";
  let edadCorte: number | null = null;
  if (preguntaEdad(enfermedad)) {
    edadCorte = corteEdad(enfermedad, organo, parentesco);
    edadRespuesta = ["antes", "despues", "no_se"].includes(edadElegida) ? edadElegida : "no_se";
  }

  const supabase = await createClient();
  const { error } = await supabase.from("antecedentes").insert({
    integrante_id: integranteId,
    parentesco,
    lado,
    enfermedad,
    organo,
    tipo_diabetes: tipoDiabetes,
    sindrome,
    edad_respuesta: edadRespuesta,
    edad_corte: edadCorte,
    detalle,
  });
  if (error) return { error: "No pudimos guardar. Probá de nuevo en un rato." };

  redirect(`/persona/${integranteId}?listo=1#antecedentes`);
}

export async function borrarAntecedente(formData: FormData) {
  const id = texto(formData, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data } = await supabase.from("antecedentes").select("integrante_id").eq("id", id).maybeSingle();
  await supabase.from("antecedentes").delete().eq("id", id);
  redirect(data ? `/persona/${data.integrante_id}#antecedentes` : "/");
}
