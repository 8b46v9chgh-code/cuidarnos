// Página de inicio. Por ahora muestra quiénes están en la familia.
// El proxy ya garantiza que acá llega solo quien inició sesión.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { obtenerFamilia } from "@/lib/familia";
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
  const familia = await obtenerFamilia();
  // Primera vez: todavía no completó sus datos.
  if (!familia) redirect("/registro");

  const yo = familia.integrantes.find((i) => i.es_administrador);

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p className="text-lg">Hola, {yo?.nombre ?? ""} 👋</p>
      {agruparFamilia(familia.integrantes).map((grupo) => (
        <section key={grupo.rotulo} className="flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#4F5D5A]">{grupo.rotulo}</h2>
          <ul className="flex flex-col gap-2">
            {grupo.integrantes.map((i) => (
              <li key={i.id} className="rounded-xl bg-[#F3F6F4] px-4 py-3">
                <span className="font-bold">{i.nombre}</span>
                <span className="text-zinc-600">
                  {i.parentesco !== "yo" && ` · ${parentescoVisible(i)}`} · {edad(i.fecha_nacimiento)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Link
        href="/familia"
        className="flex h-12 items-center justify-center rounded-xl bg-[#1F6B63] font-bold text-white"
      >
        Editar mi familia
      </Link>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="h-12 w-full rounded-xl border-2 border-[#1F6B63] font-bold text-[#1F6B63]"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
