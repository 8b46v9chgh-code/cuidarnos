// Pantalla "¿Esta es tu familia?": ver, agregar, editar y sacar integrantes.
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerFamilia } from "@/lib/familia";
import { PARENTESCO, edad } from "@/lib/textos";
import { FormularioIntegrante } from "./formulario";
import { BotonBorrar } from "./boton-borrar";

export default function FamiliaPage({ searchParams }: PageProps<"/familia">) {
  return (
    <main className="flex flex-1 justify-center bg-[#F3F6F4] px-4 py-10 text-[#1E2A28]">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F6B63]">¿Esta es tu familia?</h1>
          <p className="mt-2 text-base text-zinc-700">
            Sumá a quienes quieras cuidar. Podés cambiarlo cuando quieras.
          </p>
        </div>
        <Suspense fallback={<p>Cargando…</p>}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/familia">["searchParams"] }) {
  await connection();
  const familia = await obtenerFamilia();
  if (!familia) redirect("/registro");

  const { editar } = await searchParams;
  const aEditar = familia.integrantes.find((i) => i.id === editar && !i.es_administrador);

  // El administrador primero; después, por edad (de mayor a menor).
  const integrantes = [...familia.integrantes].sort(
    (a, b) => Number(b.es_administrador) - Number(a.es_administrador) || a.fecha_nacimiento.localeCompare(b.fecha_nacimiento),
  );

  return (
    <>
      <ul className="flex flex-col gap-2">
        {integrantes.map((i) => (
          <li key={i.id} className="flex items-center gap-3 rounded-xl bg-[#F3F6F4] px-4 py-3">
            <div className="flex-1">
              <p className="font-bold">{i.nombre}</p>
              <p className="text-sm text-zinc-600">
                {PARENTESCO[i.parentesco]} · {edad(i.fecha_nacimiento)}
                {!i.es_administrador && (i.a_cargo ? " · a tu cargo" : " · no está a tu cargo")}
              </p>
            </div>
            {!i.es_administrador && (
              <div className="flex flex-col items-end gap-1">
                <Link href={`/familia?editar=${i.id}`} className="text-sm font-semibold text-[#1F6B63] underline">
                  Editar
                </Link>
                <BotonBorrar id={i.id} nombre={i.nombre} />
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-zinc-200 pt-6">
        <FormularioIntegrante integrante={aEditar} />
      </div>

      <Link
        href="/"
        className="flex h-12 items-center justify-center rounded-xl border-2 border-[#1F6B63] font-bold text-[#1F6B63]"
      >
        Listo, ir al inicio
      </Link>
      <p className="text-center text-xs text-zinc-500">Cuidarnos orienta y no reemplaza la consulta médica.</p>
    </>
  );
}
