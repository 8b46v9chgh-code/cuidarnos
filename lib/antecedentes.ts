// Antecedentes familiares: qué cambian en los controles de cada persona.
// Las reglas salen del documento "Cuidarnos: antecedentes familiares" (6/11/2026).
// Este archivo NO lee la base ni dibuja nada: recibe datos y devuelve ajustes.
// Así se puede probar solo (lib/antecedentes.test.ts) y revisar regla por regla.

// ─────────────────────────────────────────────
// Tipos (iguales a las columnas de la tabla "antecedentes")
// ─────────────────────────────────────────────
export type ParentescoFamiliar =
  | "padre" | "madre" | "hermano" | "hermana" | "hijo" | "hija"
  | "abuelo" | "abuela" | "tio" | "tia" | "otro";

export type Enfermedad =
  | "cancer" | "diabetes" | "cardiovascular" | "colesterol"
  | "hipertension" | "tiroides" | "sindrome" | "otra";

export type Organo =
  | "prostata" | "colon" | "pulmon" | "rinon" | "estomago" | "vejiga"
  | "pancreas" | "melanoma" | "mama" | "cuello_utero" | "tiroides"
  | "endometrio" | "ovario" | "otro";

export type Sindrome =
  | "brca" | "lynch" | "paf" | "li_fraumeni" | "cowden" | "cdh1"
  | "peutz_jeghers" | "cdkn2a" | "no_se_nombre";

export type Antecedente = {
  id: string;
  integrante_id: string; // de quién es familiar el enfermo
  parentesco: ParentescoFamiliar;
  lado: "paterno" | "materno" | null;
  enfermedad: Enfermedad;
  organo: Organo | null;
  tipo_diabetes: "1" | "2" | "no_se" | null;
  sindrome: Sindrome | null;
  edad_respuesta: "antes" | "despues" | "no_se";
  edad_corte: number | null;
  detalle: string | null;
};

// Lo mínimo que hace falta saber de cada integrante de la app.
export type Persona = {
  id: string;
  parentesco: "yo" | "pareja" | "hijo" | "padre" | "madre" | "otro";
  sexo: "F" | "M";
  fecha_nacimiento: string; // AAAA-MM-DD
  peso_kg: number | null;
  altura_cm: number | null;
};

// ─────────────────────────────────────────────
// Lo que devuelve la lógica
// ─────────────────────────────────────────────

// Cambia una regla que ya existe en la tabla "reglas".
export type Ajuste = {
  regla_id: string;
  edad_desde_meses?: number; // nueva edad de inicio
  intervalo_meses?: number; // nuevo intervalo
  reemplazar_por?: string; // usar otra regla en su lugar (SOMFi → colonoscopía)
  motivo: string;
};

// Un control que no existe para el riesgo promedio y se suma por el antecedente.
export type Extra = {
  id: string; // "AF-..." para distinguirlos de las reglas de la base
  area: "cardiovascular" | "diabetes" | "cancer" | "otros";
  control: string;
  edad_desde_meses: number;
  edad_hasta_meses: number | null;
  intervalo_meses: number; // 0 = una sola vez
  motivo: string;
};

// Un aviso: "rojo" = consultar a un especialista; "info" = para charlar con el médico.
export type Aviso = {
  nivel: "rojo" | "info";
  area: "cancer" | "diabetes" | "cardiovascular" | "otros";
  titulo: string;
  motivo: string;
};

export type ResultadoAntecedentes = {
  ajustes: Ajuste[];
  extras: Extra[];
  avisos: Aviso[];
};

// ─────────────────────────────────────────────
// Cortes de edad: los usa la pantalla para preguntar "¿tenía menos de X años?"
// y esta lógica para interpretar la respuesta. Un solo lugar para los dos.
// ─────────────────────────────────────────────
export function corteEdad(enfermedad: Enfermedad, organo: Organo | null, parentesco: ParentescoFamiliar): number {
  if (enfermedad === "cancer") {
    if (organo === "colon") return 60;
    if (organo === "prostata") return 65;
    return 50; // mama, endometrio y el resto: 50
  }
  if (enfermedad === "cardiovascular") return sexoDe(parentesco) === "F" ? 65 : 55;
  return 50;
}

// "No sé" cuenta como joven: ante la duda, el caso de más riesgo (decisión del 6/11).
function fueJoven(a: Antecedente) {
  return a.edad_respuesta !== "despues";
}

const MESES = (anios: number) => anios * 12;

// ─────────────────────────────────────────────
// Grado de parentesco y sexo del familiar
// ─────────────────────────────────────────────
const PRIMER_GRADO: ParentescoFamiliar[] = ["padre", "madre", "hermano", "hermana", "hijo", "hija"];
const SEGUNDO_GRADO: ParentescoFamiliar[] = ["abuelo", "abuela", "tio", "tia"];

export function sexoDe(p: ParentescoFamiliar): "F" | "M" | null {
  if (["padre", "hermano", "hijo", "abuelo", "tio"].includes(p)) return "M";
  if (["madre", "hermana", "hija", "abuela", "tia"].includes(p)) return "F";
  return null;
}

// Un antecedente visto desde una persona concreta: con su grado y su lado.
export type AntecedenteVisto = Antecedente & {
  grado: 1 | 2;
  // null = no se sabe o no aplica (hermanos, hijos): cuenta para cualquier lado.
  ladoVisto: "paterno" | "materno" | null;
};

// Junta los antecedentes que le corresponden a una persona:
// - los cargados como "familiar de" ella misma;
// - si es hijo/a del administrador, los cargados para "yo" o "pareja"
//   (el padre del administrador es el abuelo del hijo: 2do grado).
// Lo que queda a 3er grado o más (o parentesco "otro") no se usa para reglas.
export function antecedentesDe(persona: Persona, integrantes: Persona[], antecedentes: Antecedente[]): AntecedenteVisto[] {
  const vistos: AntecedenteVisto[] = [];

  for (const a of antecedentes) {
    if (a.integrante_id === persona.id) {
      const grado = PRIMER_GRADO.includes(a.parentesco) ? 1 : SEGUNDO_GRADO.includes(a.parentesco) ? 2 : null;
      if (!grado) continue;
      const ladoVisto = a.parentesco === "padre" ? "paterno" : a.parentesco === "madre" ? "materno" : a.lado;
      vistos.push({ ...a, grado, ladoVisto });
      continue;
    }

    // Propagación a los hijos del administrador.
    if (persona.parentesco !== "hijo") continue;
    const ancla = integrantes.find((i) => i.id === a.integrante_id);
    if (!ancla || (ancla.parentesco !== "yo" && ancla.parentesco !== "pareja")) continue;
    // El lado, visto desde el hijo, depende de si el ancla es su papá o su mamá.
    const ladoHijo = ancla.sexo === "M" ? "paterno" : "materno";

    if (a.parentesco === "padre" || a.parentesco === "madre" || a.parentesco === "hermano" || a.parentesco === "hermana") {
      // Abuelos y tíos del hijo: 2do grado.
      vistos.push({ ...a, grado: 2, ladoVisto: ladoHijo });
    } else if (a.parentesco === "hijo" || a.parentesco === "hija") {
      // Hermanos del hijo: 1er grado (salvo que sea él mismo, que no se carga así).
      vistos.push({ ...a, grado: 1, ladoVisto: null });
    }
    // Abuelos y tíos del administrador quedan a 3er grado del hijo: no se usan.
  }

  return vistos;
}

// Mismo lado: si alguno no tiene lado conocido, se cuenta (ante la duda, más riesgo).
function mismoLado(x: AntecedenteVisto, y: AntecedenteVisto) {
  return !x.ladoVisto || !y.ladoVisto || x.ladoVisto === y.ladoVisto;
}

function edadEnMeses(fechaNacimiento: string, hoy: string) {
  const [an, mn, dn] = fechaNacimiento.split("-").map(Number);
  const [ah, mh, dh] = hoy.split("-").map(Number);
  let meses = (ah - an) * 12 + (mh - mn);
  if (dh < dn) meses--;
  return meses;
}

function imc(p: Persona) {
  if (!p.peso_kg || !p.altura_cm) return null;
  const m = p.altura_cm / 100;
  return p.peso_kg / (m * m);
}

// ─────────────────────────────────────────────
// La función principal
// ─────────────────────────────────────────────
export function evaluarAntecedentes(persona: Persona, vistos: AntecedenteVisto[], hoy: string): ResultadoAntecedentes {
  const ajustes: Ajuste[] = [];
  const extras: Extra[] = [];
  const avisos: Aviso[] = [];
  const esAdulto = edadEnMeses(persona.fecha_nacimiento, hoy) >= MESES(18);

  const cancer = (organo: Organo) => vistos.filter((a) => a.enfermedad === "cancer" && a.organo === organo);
  const primero = (lista: AntecedenteVisto[]) => lista.filter((a) => a.grado === 1);

  // ── Colon ──────────────────────────────────
  const colon1 = primero(cancer("colon"));
  if (colon1.length >= 2 || colon1.some(fueJoven)) {
    // 1 familiar de 1er grado antes de los 60, o 2 de 1er grado a cualquier edad.
    ajustes.push({
      regla_id: "CA-04",
      reemplazar_por: "CA-05",
      edad_desde_meses: MESES(40),
      intervalo_meses: 60,
      motivo:
        colon1.length >= 2
          ? "Dos familiares de 1er grado con cáncer de colon: colonoscopía desde los 40, cada 5 años."
          : "Familiar de 1er grado con cáncer de colon antes de los 60: colonoscopía desde los 40 (o 10 años antes de la edad del familiar, si fue antes de los 50), cada 5 años.",
    });
  } else if (colon1.length === 1) {
    // 1 familiar de 1er grado a los 60 o más: mismos métodos, desde los 40.
    const motivo = "Familiar de 1er grado con cáncer de colon a los 60 o más: el tamizaje empieza a los 40.";
    ajustes.push({ regla_id: "CA-04", edad_desde_meses: MESES(40), motivo });
    ajustes.push({ regla_id: "CA-05", edad_desde_meses: MESES(40), motivo });
  }

  // ── Próstata (American Cancer Society) ─────
  if (persona.sexo === "M") {
    const prost = cancer("prostata").filter((a) => a.grado === 1 && (a.parentesco === "padre" || a.parentesco === "hermano"));
    const jovenes = prost.filter(fueJoven);
    if (jovenes.length >= 2) {
      ajustes.push({
        regla_id: "CA-06",
        edad_desde_meses: MESES(40),
        motivo: "Dos o más familiares de 1er grado con cáncer de próstata antes de los 65: la charla sobre PSA empieza a los 40.",
      });
    } else if (jovenes.length === 1) {
      ajustes.push({
        regla_id: "CA-06",
        edad_desde_meses: MESES(45),
        motivo: "Padre o hermano con cáncer de próstata antes de los 65: la charla sobre PSA empieza a los 45.",
      });
    }
  }

  // ── Gástrico: buscar y tratar Helicobacter ─
  if (esAdulto && primero(cancer("estomago")).length > 0) {
    extras.push({
      id: "AF-HP",
      area: "cancer",
      control: "Búsqueda de Helicobacter pylori (y tratamiento si da positivo)",
      edad_desde_meses: MESES(18),
      edad_hasta_meses: null,
      intervalo_meses: 0,
      motivo: "Familiar de 1er grado con cáncer de estómago.",
    });
  }

  // ── Melanoma: control de lunares anual ─────
  if (esAdulto && primero(cancer("melanoma")).length > 0) {
    extras.push({
      id: "AF-DERM",
      area: "cancer",
      control: "Control dermatológico de lunares",
      edad_desde_meses: MESES(18),
      edad_hasta_meses: null,
      intervalo_meses: 12,
      motivo: "Familiar de 1er grado con melanoma.",
    });
  }

  // ── Señales de cáncer hereditario → asesoramiento genético ──
  const mama = cancer("mama"); // 1er y 2do grado
  const ovario = cancer("ovario");
  const senales: string[] = [];
  if (mama.some(fueJoven)) senales.push("cáncer de mama antes de los 50");
  if (mama.some((a) => sexoDe(a.parentesco) === "M")) senales.push("cáncer de mama en un varón");
  if (mama.length >= 2) senales.push("dos o más familiares con cáncer de mama");
  if (ovario.length > 0) senales.push("cáncer de ovario, trompa o peritoneo");

  const espectroLynch = vistos.filter((a) => a.enfermedad === "cancer" && (a.organo === "colon" || a.organo === "endometrio"));
  const endometrio = cancer("endometrio");
  if (endometrio.some((e) => [...cancer("colon"), ...ovario].some((o) => mismoLado(e, o)))) {
    senales.push("cáncer de endometrio junto con colon u ovario en la misma rama (sospecha de Lynch)");
  } else if (espectroLynch.length >= 3) {
    senales.push("tres o más familiares con cáncer de colon o endometrio (sospecha de Lynch)");
  }

  const sindromes = vistos.filter((a) => a.enfermedad === "sindrome");
  if (sindromes.length > 0) senales.push("un síndrome genético conocido en la familia");

  if (senales.length > 0) {
    avisos.push({
      nivel: "rojo",
      area: "cancer",
      titulo: "Consultá con asesoramiento genético oncológico",
      motivo: `Hay ${senales.length === 1 ? "una señal" : "señales"} de cáncer hereditario: ${senales.join("; ")}. La app no calcula estos controles: los define el especialista.`,
    });
  }

  // ── Páncreas (CAPS) ────────────────────────
  const pancreas = cancer("pancreas");
  const pancreasFamiliar = pancreas.some(
    (a) => a.grado === 1 && pancreas.some((b) => b.id !== a.id && mismoLado(a, b)),
  );
  if (pancreasFamiliar) {
    avisos.push({
      nivel: "rojo",
      area: "cancer",
      titulo: "Consultá en un centro especializado en páncreas",
      motivo:
        "Dos o más familiares del mismo lado con cáncer de páncreas, uno de 1er grado. La vigilancia (desde los 50, o 10 años antes del familiar más joven) se hace en centros con experiencia.",
    });
  }

  // ── Diabetes tipo 2 (ADA) ──────────────────
  // "No sé el tipo" se toma como tipo 2: es mucho más frecuente.
  const dm2 = vistos.filter((a) => a.enfermedad === "diabetes" && a.tipo_diabetes !== "1");
  if (esAdulto && dm2.some((a) => a.grado === 1)) {
    const valor = imc(persona);
    if (valor !== null && valor >= 25) {
      ajustes.push({
        regla_id: "DM-01",
        edad_desde_meses: MESES(18),
        intervalo_meses: 36,
        motivo: "Familiar de 1er grado con diabetes tipo 2 y un IMC de 25 o más: glucemia ya, sin esperar a los 35, cada 3 años.",
      });
    }
  }
  if (!esAdulto && dm2.length > 0) {
    // En chicos el sobrepeso se mide con percentiles, que la app todavía no calcula.
    avisos.push({
      nivel: "info",
      area: "diabetes",
      titulo: "Glucemia desde los 10 años si hay sobrepeso",
      motivo:
        "Hay diabetes tipo 2 en la familia. Si tiene sobrepeso, conviene una glucemia desde la pubertad o los 10 años, cada 3 años. Consultalo con el pediatra.",
    });
  }

  // ── Diabetes tipo 1: solo informativo (decisión del 6/11) ──
  if (vistos.some((a) => a.enfermedad === "diabetes" && a.tipo_diabetes === "1" && a.grado === 1)) {
    avisos.push({
      nivel: "info",
      area: "diabetes",
      titulo: "Diabetes tipo 1 en la familia",
      motivo:
        "Los familiares de 1er grado tienen unas 10 veces más riesgo. Existe un análisis de autoanticuerpos para detectarla antes: consultalo con el médico.",
    });
  }

  // ── Infarto precoz y colesterol familiar ───
  const cvPrecoz = vistos.some((a) => a.enfermedad === "cardiovascular" && a.grado === 1 && fueJoven(a));
  const colesterol = vistos.some((a) => a.enfermedad === "colesterol" && a.grado === 1);
  if (cvPrecoz || colesterol) {
    const motivo = colesterol
      ? "Colesterol muy alto o hipercolesterolemia familiar en un familiar de 1er grado."
      : "Infarto, ACV o muerte súbita en un familiar de 1er grado (varón antes de los 55, mujer antes de los 65). El riesgo cardiovascular es 1,5 veces mayor.";
    if (esAdulto) {
      ajustes.push({ regla_id: "CV-03", edad_desde_meses: colesterol ? MESES(18) : MESES(20), motivo });
    } else {
      extras.push({
        id: "AF-LIP",
        area: "cardiovascular",
        control: "Perfil lipídico (colesterol)",
        edad_desde_meses: MESES(2),
        edad_hasta_meses: MESES(18) - 1,
        intervalo_meses: 0,
        motivo,
      });
    }
  }

  // ── Tiroides autoinmune ────────────────────
  if (esAdulto && vistos.some((a) => a.enfermedad === "tiroides" && a.grado === 1)) {
    extras.push({
      id: "AF-TSH",
      area: "otros",
      control: "TSH (función tiroidea)",
      edad_desde_meses: MESES(18),
      edad_hasta_meses: null,
      intervalo_meses: 60,
      motivo: "Familiar de 1er grado con enfermedad de tiroides. Intervalo propuesto, a validar con endocrinología.",
    });
  }

  // Hipertensión, "otra" y los cánceres sin regla (pulmón, riñón, etc.) no cambian nada:
  // quedan guardados para mostrárselos al médico.

  return { ajustes, extras, avisos };
}
