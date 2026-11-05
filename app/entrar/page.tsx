"use client";

// Pantalla de ingreso: la persona pone su mail y le llega un link para entrar.
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EntrarPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#F3F6F4] px-4 py-12 text-[#1E2A28]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Cuidarnos</h1>
        {/* Suspense: lo pide Next para leer la dirección (?error=) en el navegador. */}
        <Suspense>
          <Formulario />
        </Suspense>
        <p className="mt-6 text-center text-xs text-zinc-500">
          Cuidarnos orienta y no reemplaza la consulta médica.
        </p>
      </div>
    </main>
  );
}

function Formulario() {
  const linkFallido = useSearchParams().get("error") === "link";
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(
    linkFallido ? "Ese link no sirvió (ya se usó, venció o se abrió en otro navegador). Pedí uno nuevo." : null,
  );

  async function pedirLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        // A dónde vuelve la persona cuando toca el link del mail.
        emailRedirectTo: `${window.location.origin}/auth/confirmar`,
      },
    });
    setCargando(false);
    if (error) {
      setError(traducirError(error.message));
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p className="text-base">
          Listo. Te mandamos un mail a <strong>{email}</strong> con un link para entrar.
        </p>
        <p className="rounded-xl bg-[#E3F0EC] p-3 text-sm">
          Abrilo <strong>en este mismo navegador</strong>. Si no lo ves, fijate en spam. El mail
          llega en inglés y dice &quot;Sign in&quot;.
        </p>
        <button
          type="button"
          onClick={() => setEnviado(false)}
          className="text-sm font-semibold text-[#1F6B63] underline"
        >
          Usar otro mail
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={pedirLink} className="mt-6 flex flex-col gap-4">
        <p className="text-base">Poné tu mail y te mandamos un link para entrar.</p>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Tu mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border border-zinc-300 px-3 text-base font-normal outline-none focus:border-[#1F6B63]"
          />
        </label>
        <button
          type="submit"
          disabled={cargando}
          className="h-12 rounded-xl bg-[#1F6B63] text-base font-bold text-white disabled:opacity-60"
        >
          {cargando ? "Un segundo…" : "Mandame el link"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {error}
        </p>
      )}
    </>
  );
}

// Los errores de Supabase vienen en inglés; acá los pasamos a algo entendible.
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("rate limit") || m.includes("security purposes")) {
    return "Pediste muchos mails seguidos. Esperá unos minutos y probá de nuevo.";
  }
  return "Algo salió mal. Probá de nuevo en un rato.";
}
