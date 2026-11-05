"use client";

// Botón "Ya me lo hice" de cada control: se abre un formulario chico con fecha e informe.
import { useActionState, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardarControl, type EstadoControl } from "./acciones";

const MAX_MB = 10;
const campo =
  "h-11 rounded-xl border border-zinc-300 bg-white px-3 text-base outline-none focus:border-[#1F6B63]";

export function YaMeLoHice(props: {
  familiaId: string;
  integranteId: string;
  opciones: { id: string; control: string }[];
  hoy: string;
  textoBoton: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState(guardarControl, { error: null } as EstadoControl);
  const [enviando, iniciar] = useTransition();
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="h-11 rounded-xl bg-[#1F6B63] px-4 text-sm font-bold text-white"
      >
        {props.textoBoton}
      </button>
    );
  }

  async function enviar(formData: FormData) {
    setErrorArchivo(null);
    const archivo = formData.get("informe");
    formData.delete("informe");
    if (archivo instanceof File && archivo.size > 0) {
      if (archivo.size > MAX_MB * 1024 * 1024) return setErrorArchivo(`El archivo pesa más de ${MAX_MB} MB.`);
      // Carpeta: <familia>/<integrante>/<nombre al azar>.<extensión>
      const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const ruta = `${props.familiaId}/${props.integranteId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await createClient().storage.from("informes").upload(ruta, archivo);
      if (error) return setErrorArchivo("No pudimos subir el informe. Tiene que ser PDF o foto (JPG, PNG, HEIC).");
      formData.set("informe_path", ruta);
    }
    iniciar(() => accion(formData));
  }

  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-xl bg-white p-3">
      <input type="hidden" name="integrante_id" value={props.integranteId} />
      {props.opciones.length === 1 ? (
        <input type="hidden" name="regla_id" value={props.opciones[0].id} />
      ) : (
        // Ej.: para colon se puede anotar SOMFi o colonoscopía.
        <label className="flex flex-col gap-1 text-sm font-semibold">
          ¿Cuál?
          <select name="regla_id" required className={campo}>
            {props.opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.control}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm font-semibold">
        ¿Cuándo?
        <input name="fecha" type="date" required min="1900-01-01" max={props.hoy} defaultValue={props.hoy} className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Informe (opcional, PDF o foto)
        <input
          name="informe"
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
          className="text-sm font-normal file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-[#E3F0EC] file:px-4 file:font-bold file:text-[#1F6B63]"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="h-11 flex-1 rounded-xl bg-[#1F6B63] text-sm font-bold text-white disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="h-11 px-3 text-sm font-semibold text-[#1F6B63] underline">
          Cancelar
        </button>
      </div>
      {(errorArchivo ?? estado.error) && (
        <p role="alert" className="rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {errorArchivo ?? estado.error}
        </p>
      )}
    </form>
  );
}
