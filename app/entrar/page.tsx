"use client";

// Pantalla de ingreso: 1) la persona pone su mail, 2) escribe el código que le llegó.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Paso = "mail" | "codigo";

export default function EntrarPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("mail");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setCargando(false);
    if (error) {
      setError(traducirError(error.message));
      return;
    }
    setPaso("codigo");
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codigo.trim(),
      type: "email",
    });
    if (error) {
      setCargando(false);
      setError(traducirError(error.message));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[#F3F6F4] px-4 py-12 text-[#1E2A28]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-[#1F6B63]">Cuidarnos</h1>

        {paso === "mail" ? (
          <form onSubmit={pedirCodigo} className="mt-6 flex flex-col gap-4">
            <p className="text-base">Poné tu mail y te mandamos un código para entrar.</p>
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
            <Boton cargando={cargando}>Mandame el código</Boton>
          </form>
        ) : (
          <form onSubmit={verificarCodigo} className="mt-6 flex flex-col gap-4">
            <p className="text-base">
              Te mandamos un código a <strong>{email}</strong>. Fijate también en spam.
            </p>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Código
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6,10}"
                maxLength={10}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                className="h-12 rounded-xl border border-zinc-300 px-3 text-center text-xl tracking-[0.3em] font-normal outline-none focus:border-[#1F6B63]"
              />
            </label>
            <Boton cargando={cargando}>Entrar</Boton>
            <button
              type="button"
              onClick={() => {
                setPaso("mail");
                setCodigo("");
                setError(null);
              }}
              className="text-sm font-semibold text-[#1F6B63] underline"
            >
              Cambiar el mail
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          Cuidarnos orienta y no reemplaza la consulta médica.
        </p>
      </div>
    </main>
  );
}

function Boton({ cargando, children }: { cargando: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={cargando}
      className="h-12 rounded-xl bg-[#1F6B63] text-base font-bold text-white disabled:opacity-60"
    >
      {cargando ? "Un segundo…" : children}
    </button>
  );
}

// Los errores de Supabase vienen en inglés; acá los pasamos a algo entendible.
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("rate limit") || m.includes("security purposes")) {
    return "Pediste muchos códigos seguidos. Esperá unos minutos y probá de nuevo.";
  }
  if (m.includes("expired") || m.includes("invalid")) {
    return "El código no es válido o ya venció. Pedí uno nuevo.";
  }
  return "Algo salió mal. Probá de nuevo en un rato.";
}
