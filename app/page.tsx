// Inicio: la familia agrupada. Cada integrante se toca para ver su semáforo.
// El proxy ya garantiza que acá llega solo quien inició sesión.
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerFamilia } from "@/lib/familia";
import { obtenerControlesRealizados, obtenerReglas } from "@/lib/controles";
import { calcularSemaforo, contar, edadEnMeses, hoyAR } from "@/lib/semaforo";
import { agruparFamilia, edad, parentescoVisible } from "@/lib/textos";
import { cerrarSesion } from "./acciones";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#F3F6F4] px-4 py-12 text-[#1E2A28]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Cuidarnos</h1>
        {/* Suspense: la parte que lee la sesión espera sin frenar el resto de la página. */}
        <Suspense fallback={<p className="mt-4">Cargando…</p>}>
          <MiFamilia />
        </Suspense>
      </div>
    </main>
  );
}

async function MiFamilia() {
  // Le avisa a Next que esta parte depende de quién entra y se arma en cada pedido.
  await connection();
  const [familia, reglas, controles] = await Promise.all([obtenerFamilia(), obtenerReglas(), obtenerControlesRealizados()]);
  // Primera vez: todavía no completó sus datos.
  if (!familia) redirect("/registro");

  const hoy = hoyAR();
  const yo = familia.integrantes.find((i) => i.es_administrador);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-lg">Hola, {yo?.nombre ?? ""} 👋</p>
      <p className="-mt-2 text-sm text-zinc-600">Tocá a alguien para ver qué le corresponde.</p>
      {agruparFamilia(familia.integrantes).map((grupo) => (
        <section key={grupo.rotulo} className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#4F5D5A]">{grupo.rotulo}</h2>
          <ul className="flex flex-col gap-2">
            {grupo.integrantes.map((i) => {
              const esMenor = edadEnMeses(i.fecha_nacimiento, hoy) < 18 * 12;
              const n = contar(calcularSemaforo(i, reglas, controles.filter((c) => c.integrante_id === i.id), hoy));
              return (
                <li key={i.id}>
                  <Link
                    href={`/persona/${i.id}`}
                    className="flex items-center gap-3 rounded-xl bg-[#F3F6F4] px-4 py-3 hover:bg-[#E3F0EC]"
                  >
                    <span className="flex-1">
                      <span className="font-bold">{i.nombre}</span>
                      <span className="text-zinc-600">
                        {i.parentesco !== "yo" && ` · ${parentescoVisible(i)}`} · {edad(i.fecha_nacimiento)}
                      </span>
                    </span>
                    {!esMenor && <Resumen rojo={n.rojo} amarillo={n.amarillo} verde={n.verde} />}
                    <span aria-hidden="true" className="text-[#1F6B63]">›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <Link
        href="/familia"
        className="flex h-12 items-center justify-center rounded-xl border-2 border-[#1F6B63] font-bold text-[#1F6B63]"
      >
        Editar mi familia
      </Link>
      <form action={cerrarSesion}>
        <button type="submit" className="h-12 w-full text-sm font-semibold text-zinc-600 underline">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

// Puntitos de color con la cantidad de controles en cada estado.
function Resumen({ rojo, amarillo, verde }: { rojo: number; amarillo: number; verde: number }) {
  return (
    <span className="flex gap-1 text-xs font-extrabold" aria-label={`${rojo} atrasados, ${amarillo} por vencer, ${verde} al día`}>
      {rojo > 0 && <span className="rounded-full bg-[#FDE4E4] px-2 py-0.5 text-[#8E1F26]">{rojo}</span>}
      {amarillo > 0 && <span className="rounded-full bg-[#FDF3D6] px-2 py-0.5 text-[#7A5A00]">{amarillo}</span>}
      {verde > 0 && <span className="rounded-full bg-[#E4F3E8] px-2 py-0.5 text-[#1E6B3A]">{verde}</span>}
    </span>
  );
}
