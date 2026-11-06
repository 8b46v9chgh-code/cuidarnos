// Pruebas de lib/antecedentes.ts con familias inventadas.
// Correr con: npm test  (.mts = módulo moderno, así Node no avisa)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  antecedentesDe,
  corteEdad,
  evaluarAntecedentes,
  type Antecedente,
  type Persona,
} from "./antecedentes.ts";

const HOY = "2026-11-06";

// La familia de prueba: administrador de 45, pareja de 42 y un hijo de 12.
const yo: Persona = { id: "yo", parentesco: "yo", sexo: "M", fecha_nacimiento: "1981-03-10", peso_kg: 80, altura_cm: 178 };
const pareja: Persona = { id: "pareja", parentesco: "pareja", sexo: "F", fecha_nacimiento: "1984-07-01", peso_kg: 60, altura_cm: 165 };
const hijo: Persona = { id: "hijo", parentesco: "hijo", sexo: "M", fecha_nacimiento: "2014-05-20", peso_kg: 40, altura_cm: 150 };
const familia = [yo, pareja, hijo];

let n = 0;
function ant(parcial: Partial<Antecedente> & Pick<Antecedente, "integrante_id" | "parentesco" | "enfermedad">): Antecedente {
  return {
    id: `a${++n}`,
    lado: null,
    organo: null,
    tipo_diabetes: null,
    sindrome: null,
    edad_respuesta: "no_se",
    edad_corte: null,
    detalle: null,
    ...parcial,
  };
}

function evaluar(persona: Persona, antecedentes: Antecedente[]) {
  return evaluarAntecedentes(persona, antecedentesDe(persona, familia, antecedentes), HOY);
}

test("sin antecedentes no cambia nada", () => {
  assert.deepEqual(evaluar(yo, []), { ajustes: [], extras: [], avisos: [] });
});

test("cortes de edad según la enfermedad", () => {
  assert.equal(corteEdad("cancer", "colon", "padre"), 60);
  assert.equal(corteEdad("cancer", "mama", "madre"), 50);
  assert.equal(corteEdad("cancer", "prostata", "padre"), 65);
  assert.equal(corteEdad("cardiovascular", null, "padre"), 55);
  assert.equal(corteEdad("cardiovascular", null, "madre"), 65);
});

test("padre con colon a los 55: colonoscopía desde los 40, cada 5 años", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "colon", edad_respuesta: "antes", edad_corte: 60 })]);
  assert.equal(r.ajustes.length, 1);
  assert.deepEqual(
    { ...r.ajustes[0], motivo: undefined },
    { regla_id: "CA-04", reemplazar_por: "CA-05", edad_desde_meses: 480, intervalo_meses: 60, motivo: undefined },
  );
});

test("padre con colon a los 70: mismos métodos, desde los 40", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "colon", edad_respuesta: "despues", edad_corte: 60 })]);
  assert.deepEqual(r.ajustes.map((a) => [a.regla_id, a.edad_desde_meses, a.reemplazar_por]), [
    ["CA-04", 480, undefined],
    ["CA-05", 480, undefined],
  ]);
});

test("edad 'no sé' cuenta como joven", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "madre", enfermedad: "cancer", organo: "colon", edad_respuesta: "no_se" })]);
  assert.equal(r.ajustes[0].reemplazar_por, "CA-05");
});

test("abuelo con colon: 2do grado, no cambia nada", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "abuelo", lado: "paterno", enfermedad: "cancer", organo: "colon", edad_respuesta: "antes" })]);
  assert.equal(r.ajustes.length, 0);
});

test("madre con mama a los 45: derivación a asesoramiento genético", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "madre", enfermedad: "cancer", organo: "mama", edad_respuesta: "antes", edad_corte: 50 })]);
  assert.equal(r.avisos.length, 1);
  assert.equal(r.avisos[0].nivel, "rojo");
  assert.match(r.avisos[0].motivo, /mama antes de los 50/);
});

test("madre con mama a los 60: sin cambios (mamografía anual desde los 40 ya es el estándar)", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "madre", enfermedad: "cancer", organo: "mama", edad_respuesta: "despues", edad_corte: 50 })]);
  assert.deepEqual(r, { ajustes: [], extras: [], avisos: [] });
});

test("mama en un varón: derivación", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "padre", enfermedad: "cancer", organo: "mama", edad_respuesta: "despues" })]);
  assert.match(r.avisos[0].motivo, /mama en un varón/);
});

test("ovario en cualquier familiar: derivación", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "tia", lado: "materno", enfermedad: "cancer", organo: "ovario", edad_respuesta: "despues" })]);
  assert.match(r.avisos[0].motivo, /ovario/);
});

test("endometrio y colon del mismo lado: sospecha de Lynch", () => {
  const r = evaluar(yo, [
    ant({ integrante_id: "yo", parentesco: "abuela", lado: "materno", enfermedad: "cancer", organo: "endometrio", edad_respuesta: "despues" }),
    ant({ integrante_id: "yo", parentesco: "tio", lado: "materno", enfermedad: "cancer", organo: "colon", edad_respuesta: "despues" }),
  ]);
  assert.match(r.avisos[0].motivo, /Lynch/);
});

test("endometrio y colon de lados distintos: no es señal de Lynch", () => {
  const r = evaluar(yo, [
    ant({ integrante_id: "yo", parentesco: "abuela", lado: "materno", enfermedad: "cancer", organo: "endometrio", edad_respuesta: "despues" }),
    ant({ integrante_id: "yo", parentesco: "tio", lado: "paterno", enfermedad: "cancer", organo: "colon", edad_respuesta: "despues" }),
  ]);
  assert.equal(r.avisos.length, 0);
});

test("síndrome genético conocido: derivación", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "hermana", enfermedad: "sindrome", sindrome: "brca" })]);
  assert.match(r.avisos[0].motivo, /síndrome genético/);
});

test("próstata: padre antes de los 65 → 45; dos familiares → 40; después de los 65 → nada", () => {
  const padre = ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "prostata", edad_respuesta: "antes", edad_corte: 65 });
  const hermano = ant({ integrante_id: "yo", parentesco: "hermano", enfermedad: "cancer", organo: "prostata", edad_respuesta: "antes", edad_corte: 65 });
  assert.equal(evaluar(yo, [padre]).ajustes[0].edad_desde_meses, 45 * 12);
  assert.equal(evaluar(yo, [padre, hermano]).ajustes[0].edad_desde_meses, 40 * 12);
  const tarde = ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "prostata", edad_respuesta: "despues", edad_corte: 65 });
  assert.equal(evaluar(yo, [tarde]).ajustes.length, 0);
});

test("próstata no aplica a mujeres", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "padre", enfermedad: "cancer", organo: "prostata", edad_respuesta: "antes" })]);
  assert.equal(r.ajustes.length, 0);
});

test("estómago y melanoma en 1er grado suman controles", () => {
  const r = evaluar(yo, [
    ant({ integrante_id: "yo", parentesco: "madre", enfermedad: "cancer", organo: "estomago" }),
    ant({ integrante_id: "yo", parentesco: "hermana", enfermedad: "cancer", organo: "melanoma" }),
  ]);
  assert.deepEqual(r.extras.map((e) => e.id), ["AF-HP", "AF-DERM"]);
});

test("páncreas: dos del mismo lado con uno de 1er grado → centro especializado", () => {
  const r = evaluar(yo, [
    ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "pancreas" }),
    ant({ integrante_id: "yo", parentesco: "tio", lado: "paterno", enfermedad: "cancer", organo: "pancreas" }),
  ]);
  assert.match(r.avisos[0].titulo, /páncreas/);
});

test("páncreas: un solo caso no cambia nada", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "pancreas" })]);
  assert.equal(r.avisos.length, 0);
});

test("diabetes tipo 2 en la madre: glucemia ya si el IMC es 25 o más", () => {
  const dm = ant({ integrante_id: "yo", parentesco: "madre", enfermedad: "diabetes", tipo_diabetes: "2" });
  // yo: 80 kg, 1,78 m → IMC 25,2
  assert.equal(evaluar(yo, [dm]).ajustes[0].regla_id, "DM-01");
  // pareja: 60 kg, 1,65 m → IMC 22: no cambia
  const dmPareja = { ...dm, id: "dmp", integrante_id: "pareja" };
  assert.equal(evaluar(pareja, [dmPareja]).ajustes.length, 0);
});

test("diabetes tipo 1: solo aviso informativo", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "hermano", enfermedad: "diabetes", tipo_diabetes: "1" })]);
  assert.equal(r.ajustes.length, 0);
  assert.equal(r.avisos[0].nivel, "info");
});

test("infarto del padre a los 50: perfil lipídico desde los 20", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cardiovascular", edad_respuesta: "antes", edad_corte: 55 })]);
  assert.deepEqual(r.ajustes.map((a) => [a.regla_id, a.edad_desde_meses]), [["CV-03", 240]]);
});

test("hipertensión no cambia nada", () => {
  const r = evaluar(yo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "hipertension" })]);
  assert.deepEqual(r, { ajustes: [], extras: [], avisos: [] });
});

test("tiroides en la madre: TSH cada 5 años", () => {
  const r = evaluar(pareja, [ant({ integrante_id: "pareja", parentesco: "madre", enfermedad: "tiroides" })]);
  assert.deepEqual(r.extras.map((e) => [e.id, e.intervalo_meses]), [["AF-TSH", 60]]);
});

// ── Propagación a los hijos ──────────────────
test("el padre del administrador es 2do grado para el hijo: colon no cambia nada", () => {
  const colonAbuelo = ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cancer", organo: "colon", edad_respuesta: "antes" });
  const vistos = antecedentesDe(hijo, familia, [colonAbuelo]);
  assert.equal(vistos[0].grado, 2);
  assert.equal(vistos[0].ladoVisto, "paterno");
  assert.equal(evaluar(hijo, [colonAbuelo]).ajustes.length, 0);
});

test("la madre de la pareja con mama joven: el hijo también recibe la derivación (2do grado materno)", () => {
  const r = evaluar(hijo, [ant({ integrante_id: "pareja", parentesco: "madre", enfermedad: "cancer", organo: "mama", edad_respuesta: "antes" })]);
  assert.equal(r.avisos[0].nivel, "rojo");
});

test("infarto precoz del abuelo no es 1er grado para el hijo", () => {
  const r = evaluar(hijo, [ant({ integrante_id: "yo", parentesco: "padre", enfermedad: "cardiovascular", edad_respuesta: "antes" })]);
  assert.equal(r.extras.length, 0);
});

test("hijo con un padre (el administrador cargado como 'padre' del hijo) con colesterol familiar: perfil lipídico desde los 2", () => {
  const r = evaluar(hijo, [ant({ integrante_id: "hijo", parentesco: "padre", enfermedad: "colesterol" })]);
  assert.deepEqual(r.extras.map((e) => [e.id, e.edad_desde_meses]), [["AF-LIP", 24]]);
});

test("diabetes tipo 2 en un abuelo: aviso para el hijo por si tiene sobrepeso", () => {
  const r = evaluar(hijo, [ant({ integrante_id: "yo", parentesco: "madre", enfermedad: "diabetes", tipo_diabetes: "2" })]);
  assert.equal(r.avisos[0].nivel, "info");
  assert.match(r.avisos[0].titulo, /10 años/);
});

test("los tíos del administrador quedan a 3er grado del hijo y no se usan", () => {
  const vistos = antecedentesDe(hijo, familia, [ant({ integrante_id: "yo", parentesco: "tio", lado: "paterno", enfermedad: "cancer", organo: "colon" })]);
  assert.equal(vistos.length, 0);
});
