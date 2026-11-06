// Textos y opciones de la sección "Antecedentes familiares".
// Puro (sin base de datos): lo usan la pantalla y la validación del servidor.
import { sexoDe, type Antecedente, type Enfermedad, type Organo, type ParentescoFamiliar, type Sindrome } from "@/lib/antecedentes";

export const PARENTESCOS: [ParentescoFamiliar, string][] = [
  ["padre", "Padre"],
  ["madre", "Madre"],
  ["hermano", "Hermano"],
  ["hermana", "Hermana"],
  ["hijo", "Hijo"],
  ["hija", "Hija"],
  ["abuelo", "Abuelo"],
  ["abuela", "Abuela"],
  ["tio", "Tío"],
  ["tia", "Tía"],
  ["otro", "Otro familiar de sangre"],
];

export const ENFERMEDADES: [Enfermedad, string][] = [
  ["cancer", "Cáncer"],
  ["diabetes", "Diabetes"],
  ["cardiovascular", "Infarto, ACV o muerte súbita"],
  ["colesterol", "Colesterol muy alto desde joven"],
  ["hipertension", "Hipertensión"],
  ["tiroides", "Enfermedad de tiroides"],
  ["sindrome", "Síndrome o mutación genética conocida"],
  ["otra", "Otra enfermedad"],
];

const NOMBRE_ORGANO: Record<Organo, string> = {
  prostata: "Próstata",
  colon: "Colon y recto",
  pulmon: "Pulmón",
  rinon: "Riñón",
  estomago: "Estómago",
  vejiga: "Vejiga",
  pancreas: "Páncreas",
  melanoma: "Melanoma (piel)",
  mama: "Mama",
  cuello_utero: "Cuello de útero",
  tiroides: "Tiroides",
  endometrio: "Endometrio (cuerpo del útero)",
  ovario: "Ovario, trompa o peritoneo",
  otro: "Otro",
};

// Ordenados por frecuencia en Argentina según el sexo DEL FAMILIAR (Globocan 2022 / INC).
const ORGANOS_VARON: Organo[] = ["prostata", "colon", "pulmon", "rinon", "estomago", "vejiga", "pancreas", "melanoma", "mama", "otro"];
const ORGANOS_MUJER: Organo[] = ["mama", "colon", "cuello_utero", "pulmon", "tiroides", "pancreas", "endometrio", "ovario", "estomago", "melanoma", "otro"];
// "Otro familiar": no sabemos el sexo, se muestran todos.
const ORGANOS_TODOS: Organo[] = ["mama", "colon", "prostata", "pulmon", "cuello_utero", "rinon", "estomago", "tiroides", "vejiga", "pancreas", "endometrio", "ovario", "melanoma", "otro"];

export function organosPara(parentesco: ParentescoFamiliar): [Organo, string][] {
  const sexo = sexoDe(parentesco);
  const lista = sexo === "M" ? ORGANOS_VARON : sexo === "F" ? ORGANOS_MUJER : ORGANOS_TODOS;
  return lista.map((o) => [o, NOMBRE_ORGANO[o]]);
}

export const TIPOS_DIABETES: ["1" | "2" | "no_se", string][] = [
  ["2", "Tipo 2 (la más común, en adultos)"],
  ["1", "Tipo 1 (desde chico, con insulina)"],
  ["no_se", "No sé"],
];

export const SINDROMES: [Sindrome, string][] = [
  ["brca", "BRCA1 o BRCA2 (mama y ovario)"],
  ["lynch", "Síndrome de Lynch"],
  ["paf", "Poliposis adenomatosa familiar (APC)"],
  ["li_fraumeni", "Li-Fraumeni (TP53)"],
  ["cowden", "Cowden (PTEN)"],
  ["cdh1", "Cáncer gástrico difuso hereditario (CDH1)"],
  ["peutz_jeghers", "Peutz-Jeghers (STK11)"],
  ["cdkn2a", "Melanoma-páncreas familiar (CDKN2A)"],
  ["no_se_nombre", "Sé que hay uno, pero no el nombre"],
];

// Qué preguntas tienen sentido según lo elegido.
export const preguntaLado = (p: ParentescoFamiliar) => ["abuelo", "abuela", "tio", "tia", "otro"].includes(p);
export const preguntaEdad = (e: Enfermedad) => e === "cancer" || e === "cardiovascular";

// "Padre · cáncer de colon · antes de los 60"
export function describirAntecedente(a: Antecedente, parentescoTexto?: string) {
  const partes: string[] = [];
  const quien = parentescoTexto ?? PARENTESCOS.find(([v]) => v === a.parentesco)?.[1] ?? a.parentesco;
  partes.push(a.lado && !parentescoTexto ? `${quien} (lado ${a.lado})` : quien);

  if (a.enfermedad === "cancer") partes.push(`cáncer de ${(NOMBRE_ORGANO[a.organo ?? "otro"]).toLowerCase()}`);
  else if (a.enfermedad === "diabetes")
    partes.push(a.tipo_diabetes === "no_se" ? "diabetes (tipo no sabido)" : `diabetes tipo ${a.tipo_diabetes}`);
  else if (a.enfermedad === "sindrome") partes.push(SINDROMES.find(([v]) => v === a.sindrome)?.[1] ?? "síndrome genético");
  else partes.push((ENFERMEDADES.find(([v]) => v === a.enfermedad)?.[1] ?? a.enfermedad).toLowerCase());

  if (preguntaEdad(a.enfermedad) && a.edad_corte) {
    if (a.edad_respuesta === "antes") partes.push(`antes de los ${a.edad_corte}`);
    else if (a.edad_respuesta === "despues") partes.push(`a los ${a.edad_corte} o más`);
    else partes.push("edad no sabida");
  }
  return partes.join(" · ");
}

// Cómo ve un hijo un antecedente cargado para su papá o su mamá:
// el padre del administrador es su abuelo; el hermano, su tío; el hijo, su hermano.
const VISTO_DESDE_HIJO: Partial<Record<ParentescoFamiliar, string>> = {
  padre: "Abuelo",
  madre: "Abuela",
  hermano: "Tío",
  hermana: "Tía",
  hijo: "Hermano",
  hija: "Hermana",
};

export function parentescoDesdeHijo(a: Antecedente, lado: "paterno" | "materno" | null) {
  const base = VISTO_DESDE_HIJO[a.parentesco] ?? "Familiar";
  return lado && base !== "Hermano" && base !== "Hermana" ? `${base} ${lado}` : base;
}
