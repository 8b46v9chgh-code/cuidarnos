"use client";

// Formulario "Ya me lo hice": quién, qué, cuándo y (opcional) el informe.
import { useActionState, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardarControl, type EstadoControl } from "./acciones";

type Persona = { id: string; nombre: string; sexo: "F" | "M"; tabaco: string | null };
type ReglaCorta = { id: string; control: string; sexo: "F" | "M" | null; requiere_tabaco: string[] | null };

const campo =
  "h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base font-normal outline-none focus:border-[#1F6B63]";
const etiqueta = "flex flex-col gap-1 text-sm font-semibold";
const MAX_MB = 10;

export function FormularioControl(props: { familiaId: string; personas: Persona[]; reglas: ReglaCorta[]; hoy: string }) {
  const [estado, accion] = useActionState(guardarControl, { error: null } as EstadoControl);
  const [enviando, iniciar] = useTransition();
  const [personaId, setPersonaId] = useState(props.personas[0]?.id ?? "");
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const persona = props.personas.find((p) => p.id === personaId);
  // Solo los controles que le pueden corresponder a esa persona (sexo y tabaco).
  const reglas = props.reglas.filter(
    (r) =>
      (!r.sexo || r.sexo === persona?.sexo) &&
      (!r.requiere_tabaco || (persona?.tabaco != null && r.requiere_tabaco.includes(persona.tabaco))),
  );

  async function enviar(formData: FormData) {
    setErrorArchivo(null);
    const archivo = formData.get("informe");
    formData.delete("informe");

    if (archivo instanceof File && archivo.size > 0) {
      if (archivo.size > MAX_MB * 1024 * 1024) {
        setErrorArchivo(`El archivo pesa más de ${MAX_MB} MB.`);
        return;
      }
      // Carpeta: <familia>/<integrante>/<nombre al azar>.<extensión>
      const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const ruta = `${props.familiaId}/${personaId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await createClient().storage.from("informes").upload(ruta, archivo);
      if (error) {
        setErrorArchivo("No pudimos subir el informe. Tiene que ser PDF o foto (JPG, PNG, HEIC).");
        return;
      }
      formData.set("informe_path", ruta);
    }
    iniciar(() => accion(formData));
  }

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <h2 className="text-lg font-extrabold">Ya me lo hice</h2>

      <label className={etiqueta}>
        ¿Quién?
        <select name="integrante_id" value={personaId} onChange={(e) => setPersonaId(e.target.value)} className={campo}>
          {props.personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className={etiqueta}>
        ¿Qué?
        <select name="regla_id" required defaultValue="" key={personaId} className={campo}>
          <option value="" disabled>
            Elegí el control
          </option>
          {reglas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.control}
            </option>
          ))}
        </select>
      </label>

      <label className={etiqueta}>
        ¿Cuándo?
        <input name="fecha" type="date" required min="1900-01-01" max={props.hoy} className={campo} />
      </label>

      <label className={etiqueta}>
        Informe (opcional)
        <span className="text-xs font-normal text-zinc-600">PDF o foto, hasta {MAX_MB} MB.</span>
        <input
          name="informe"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
          className="text-sm font-normal file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-[#E3F0EC] file:px-4 file:font-bold file:text-[#1F6B63]"
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-xl bg-[#1F6B63] text-base font-bold text-white disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>

      {(errorArchivo ?? estado.error) && (
        <p role="alert" className="rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {errorArchivo ?? estado.error}
        </p>
      )}
    </form>
  );
}
