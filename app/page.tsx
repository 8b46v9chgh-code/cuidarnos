// Página de inicio (por ahora solo confirma que la sesión anda).
// El proxy ya garantiza que acá llega solo quien inició sesión.
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "./acciones";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#F3F6F4] px-4 py-12 text-[#1E2A28]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Cuidarnos</h1>
        {/* Suspense: la parte que lee la sesión espera sin frenar el resto de la página. */}
        <Suspense fallback={<p className="mt-4">Cargando…</p>}>
          <Saludo />
        </Suspense>
      </div>
    </main>
  );
}

async function Saludo() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";

  return (
    <div className="mt-4 flex flex-col gap-4">
      <p>
        Entraste como <strong>{email}</strong>.
      </p>
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
