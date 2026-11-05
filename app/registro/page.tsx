// Registro del administrador: se ve una sola vez, la primera vez que alguien entra.
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { obtenerFamilia } from "@/lib/familia";
import { FormularioRegistro } from "./formulario";

export default function RegistroPage() {
  return (
    <main className="flex flex-1 justify-center bg-[#F3F6F4] px-4 py-10 text-[#1E2A28]">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Empecemos por vos</h1>
        <p className="mt-2 text-base text-zinc-700">
          Con estos datos calculamos qué controles te tocan. Después sumás a tu familia.
        </p>
        <Suspense fallback={<p className="mt-6">Cargando…</p>}>
          <SiYaEstaRegistrado />
        </Suspense>
        <p className="mt-6 text-center text-xs text-zinc-500">
          Cuidarnos orienta y no reemplaza la consulta médica.
        </p>
      </div>
    </main>
  );
}

// Si ya se registró antes, no tiene sentido mostrarle el formulario otra vez.
async function SiYaEstaRegistrado() {
  await connection();
  const familia = await obtenerFamilia();
  if (familia) redirect("/");
  return <FormularioRegistro />;
}
