// "Ya me lo hice": anotar un control y ver lo anotado.
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerFamilia } from "@/lib/familia";
import { obtenerControlesRealizados, obtenerReglas } from "@/lib/controles";
import { agruparFamilia } from "@/lib/textos";
import { FormularioControl } from "./formulario";
import { BotonBorrarControl } from "./boton-borrar";

export default function RegistrarPage({ searchParams }: PageProps<"/registrar">) {
  return (
    <main className="flex flex-1 justify-center bg-[#F3F6F4] px-4 py-10 text-[#1E2A28]">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Controles hechos</h1>
        <Suspense fallback={<p>Cargando…</p>}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/registrar">["searchParams"] }) {
  await connection();
  const familia = await obtenerFamilia();
  if (!familia) redirect("/registro");
  const [reglas, controles, { listo }] = await Promise.all([obtenerReglas(), obtenerControlesRealizados(), searchParams]);

  // Mismo orden que en el resto de la app: vos, pareja, hijos, padres, otros.
  const personas = agruparFamilia(familia.integrantes).flatMap((g) => g.integrantes);
  const nombre = new Map(familia.integrantes.map((i) => [i.id, i.nombre]));
  const control = new Map(reglas.map((r) => [r.id, r.control]));
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });

  return (
    <>
      {listo && (
        <p role="status" className="rounded-xl bg-[#E4F3E8] p-3 text-sm font-bold text-[#1E6B3A]">
          ✓ Guardado.
        </p>
      )}

      <FormularioControl
        familiaId={familia.id}
        personas={personas.map((p) => ({ id: p.id, nombre: p.nombre, sexo: p.sexo, tabaco: p.tabaco }))}
        reglas={reglas}
        hoy={hoy}
      />

      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-6">
        <h2 className="text-lg font-extrabold">Anotados</h2>
        {controles.length === 0 && <p className="text-zinc-600">Todavía no anotaste ninguno.</p>}
        <ul className="flex flex-col gap-2">
          {controles.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-[#F3F6F4] px-4 py-3">
              <div className="flex-1">
                <p className="font-bold">{control.get(c.regla_id) ?? c.regla_id}</p>
                <p className="text-sm text-zinc-600">
                  {nombre.get(c.integrante_id)} · {formatearFecha(c.fecha)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.informe_path && (
                  <a
                    href={`/informe/${c.id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sm font-semibold text-[#1F6B63] underline"
                  >
                    Ver informe
                  </a>
                )}
                <BotonBorrarControl id={c.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/"
        className="flex h-12 items-center justify-center rounded-xl border-2 border-[#1F6B63] font-bold text-[#1F6B63]"
      >
        Volver al inicio
      </Link>
    </>
  );
}

function formatearFecha(fecha: string) {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}
