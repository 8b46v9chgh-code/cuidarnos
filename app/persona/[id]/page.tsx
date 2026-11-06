// La ficha de cada integrante: qué le corresponde y en qué color está.
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerFamilia } from "@/lib/familia";
import { obtenerControlesRealizados, obtenerReglas } from "@/lib/controles";
import { calcularSemaforo, edadEnMeses, fechaCorta, hoyAR, type ItemSemaforo } from "@/lib/semaforo";
import { edad, parentescoVisible } from "@/lib/textos";
import { YaMeLoHice } from "./ya-me-lo-hice";
import { BotonBorrarControl } from "./boton-borrar";
import { obtenerAntecedentes } from "@/lib/antecedentes-lectura";
import { antecedentesDe, type Antecedente } from "@/lib/antecedentes";
import { describirAntecedente, parentescoDesdeHijo } from "@/lib/antecedentes-textos";
import { FormularioAntecedente } from "./antecedentes-formulario";
import { BotonBorrarAntecedente } from "./boton-borrar-antecedente";

export default function PersonaPage({ params, searchParams }: PageProps<"/persona/[id]">) {
  return (
    <main className="flex flex-1 justify-center bg-[#F3F6F4] px-4 py-8 text-[#1E2A28]">
      <div className="flex w-full max-w-md flex-col gap-5">
        <Link href="/" className="text-sm font-semibold text-[#1F6B63] underline">
          ← Volver a la familia
        </Link>
        <Suspense fallback={<p>Cargando…</p>}>
          <Ficha params={params} searchParams={searchParams} />
        </Suspense>
        <p className="text-center text-xs text-zinc-500">Cuidarnos orienta y no reemplaza la consulta médica.</p>
      </div>
    </main>
  );
}

async function Ficha({
  params,
  searchParams,
}: {
  params: PageProps<"/persona/[id]">["params"];
  searchParams: PageProps<"/persona/[id]">["searchParams"];
}) {
  await connection();
  const [{ id }, { listo }, familia, reglas, controles, antecedentes] = await Promise.all([
    params,
    searchParams,
    obtenerFamilia(),
    obtenerReglas(),
    obtenerControlesRealizados(),
    obtenerAntecedentes(),
  ]);
  if (!familia) redirect("/registro");
  const persona = familia.integrantes.find((i) => i.id === id);
  if (!persona) notFound();

  const hoy = hoyAR();
  const esMenor = edadEnMeses(persona.fecha_nacimiento, hoy) < 18 * 12;
  const items = calcularSemaforo(persona, reglas, controles.filter((c) => c.integrante_id === id), hoy);
  const quien = persona.es_administrador ? "Te" : "Le";

  return (
    <>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">{persona.nombre}</h1>
        <p className="text-zinc-600">
          {persona.parentesco !== "yo" && `${parentescoVisible(persona)} · `}
          {edad(persona.fecha_nacimiento)}
        </p>
      </div>

      {listo && (
        <p role="status" className="rounded-xl bg-[#E4F3E8] p-3 text-sm font-bold text-[#1E6B3A]">
          ✓ Guardado.
        </p>
      )}

      {esMenor && (
        <p className="rounded-xl bg-white p-4 text-base">
          Los controles y vacunas de chicos y adolescentes están en revisión. Pronto aparecen acá.
        </p>
      )}
      {!esMenor && items.length === 0 && <p className="rounded-xl bg-white p-4">No hay controles para mostrar.</p>}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <Tarjeta key={item.regla.id} item={item} quien={quien} familiaId={familia.id} integranteId={id} hoy={hoy} />
        ))}
      </ul>

      <Antecedentes
        persona={persona}
        propios={antecedentes.filter((a) => a.integrante_id === id)}
        heredados={antecedentesDe(persona, familia.integrantes, antecedentes).filter((a) => a.integrante_id !== id)}
      />
    </>
  );
}

// "Antecedentes familiares": los cargados para esta persona y, si es hijo/a,
// los que le llegan de sus padres (el padre del administrador es su abuelo).
function Antecedentes(props: {
  persona: { id: string; nombre: string };
  propios: Antecedente[];
  heredados: ReturnType<typeof antecedentesDe>;
}) {
  return (
    <section id="antecedentes" className="flex scroll-mt-4 flex-col gap-3 rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-[#1F6B63]">Antecedentes familiares</h2>
      <p className="text-sm text-zinc-600">
        Enfermedades de familiares de sangre. Algunas adelantan o suman controles; otras quedan anotadas para el médico.
      </p>

      {props.propios.length === 0 && props.heredados.length === 0 && (
        <p className="text-sm text-zinc-500">Todavía no hay antecedentes cargados.</p>
      )}

      {props.propios.length > 0 && (
        <ul className="flex flex-col gap-2">
          {props.propios.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg bg-[#F3F6F4] px-3 py-2 text-sm">
              <span>
                {describirAntecedente(a)}
                {a.detalle && <span className="block text-zinc-500">{a.detalle}</span>}
              </span>
              <BotonBorrarAntecedente id={a.id} />
            </li>
          ))}
        </ul>
      )}

      {props.heredados.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Cargados en la ficha de sus padres</p>
          <ul className="flex flex-col gap-2">
            {props.heredados.map((a) => (
              <li key={a.id} className="rounded-lg bg-[#F3F6F4] px-3 py-2 text-sm">
                {describirAntecedente(a, parentescoDesdeHijo(a, a.ladoVisto))}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormularioAntecedente integranteId={props.persona.id} nombre={props.persona.nombre} />
    </section>
  );
}

const COLORES = {
  rojo: { borde: "border-[#F1B3B6]", fondo: "bg-[#FDE4E4]", texto: "text-[#8E1F26]", etiqueta: "Atrasado" },
  amarillo: { borde: "border-[#F2D58A]", fondo: "bg-[#FDF3D6]", texto: "text-[#7A5A00]", etiqueta: "Se acerca" },
  verde: { borde: "border-[#BFE0C9]", fondo: "bg-[#E4F3E8]", texto: "text-[#1E6B3A]", etiqueta: "Al día" },
} as const;

function Tarjeta(props: { item: ItemSemaforo; quien: "Te" | "Le"; familiaId: string; integranteId: string; hoy: string }) {
  const { item } = props;
  const c = COLORES[item.estado];
  const nombres = new Map(item.opciones.map((o) => [o.id, o.control]));

  let detalle: string;
  if (!item.ultimo) detalle = `Nunca registrado. ${props.quien} corresponde desde los ${Math.floor(item.regla.edad_desde_meses / 12)} años.`;
  else if (!item.vence) detalle = `Hecho el ${fechaCorta(item.ultimo.fecha)}. Es una sola vez.`;
  else if (item.estado === "rojo") detalle = `Venció el ${fechaCorta(item.vence)}.`;
  else if (item.estado === "amarillo") detalle = `Vence el ${fechaCorta(item.vence)}.`;
  else detalle = `Al día hasta el ${fechaCorta(item.vence)}.`;

  const frecuencia =
    item.regla.intervalo_meses === 0
      ? "Una sola vez"
      : item.regla.intervalo_meses % 12 === 0
        ? `Cada ${item.regla.intervalo_meses / 12 === 1 ? "año" : `${item.regla.intervalo_meses / 12} años`}`
        : `Cada ${item.regla.intervalo_meses} meses`;

  return (
    <li className={`flex flex-col gap-3 rounded-2xl border-2 ${c.borde} bg-white p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{item.opciones.length > 1 ? item.opciones.map((o) => o.control).join(" o ") : item.regla.control}</p>
          <p className="text-sm text-zinc-600">{frecuencia}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${c.fondo} ${c.texto}`}>{c.etiqueta}</span>
      </div>
      <p className={`text-sm font-semibold ${c.texto}`}>{detalle}</p>

      <YaMeLoHice
        familiaId={props.familiaId}
        integranteId={props.integranteId}
        opciones={item.opciones.map((o) => ({ id: o.id, control: o.control }))}
        hoy={props.hoy}
        textoBoton={item.ultimo ? "Lo volví a hacer" : "Ya me lo hice"}
      />

      {item.historial.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-[#1F6B63]">Historial ({item.historial.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {item.historial.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#F3F6F4] px-3 py-2">
                <span>
                  {fechaCorta(h.fecha)}
                  {item.opciones.length > 1 && ` · ${nombres.get(h.regla_id)}`}
                </span>
                <span className="flex items-center gap-3">
                  {h.informe_path && (
                    <a href={`/informe/${h.id}`} target="_blank" rel="noopener" className="font-semibold text-[#1F6B63] underline">
                      Ver informe
                    </a>
                  )}
                  <BotonBorrarControl id={h.id} />
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  );
}
