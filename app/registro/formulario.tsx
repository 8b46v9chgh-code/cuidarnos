"use client";

// Formulario de registro del administrador (pantalla 2 del prototipo).
import { useActionState } from "react";
import { registrarse, type EstadoRegistro } from "./acciones";

const inicial: EstadoRegistro = { error: null };

const campo =
  "h-12 rounded-xl border border-zinc-300 px-3 text-base font-normal outline-none focus:border-[#1F6B63]";
const etiqueta = "flex flex-col gap-1 text-sm font-semibold";

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrarse, inicial);

  return (
    <form action={accion} className="mt-6 flex flex-col gap-5">
      <label className={etiqueta}>
        Tu nombre
        <input name="nombre" required maxLength={60} autoComplete="given-name" className={campo} />
      </label>

      <label className={etiqueta}>
        Fecha de nacimiento
        <input name="fecha_nacimiento" type="date" required min="1900-01-01" className={campo} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Sexo</legend>
        <div className="flex gap-3">
          <Opcion name="sexo" value="F" texto="Mujer" required />
          <Opcion name="sexo" value="M" texto="Varón" required />
        </div>
      </fieldset>

      <p className="-mb-2 text-sm text-zinc-600">
        Lo que sigue es opcional. Si no lo sabés, dejalo vacío y lo completás después.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <label className={etiqueta}>
          Peso (kg)
          <input name="peso_kg" inputMode="decimal" className={campo} />
        </label>
        <label className={etiqueta}>
          Altura (cm)
          <input name="altura_cm" inputMode="decimal" className={campo} />
        </label>
        <label className={etiqueta}>
          Cintura (cm)
          <input name="cintura_cm" inputMode="decimal" className={campo} />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">¿Fumás?</legend>
        <div className="flex flex-wrap gap-3">
          <Opcion name="tabaco" value="nunca" texto="Nunca fumé" />
          <Opcion name="tabaco" value="ex" texto="Fumaba, dejé" />
          <Opcion name="tabaco" value="actual" texto="Sí, fumo" />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Actividad física</legend>
        <div className="flex flex-wrap gap-3">
          <Opcion name="actividad" value="poca" texto="Poca" />
          <Opcion name="actividad" value="moderada" texto="Moderada" />
          <Opcion name="actividad" value="mucha" texto="Mucha" />
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-base">
        <input name="acepta_avisos" type="checkbox" className="mt-1 h-5 w-5 accent-[#1F6B63]" />
        Quiero recibir avisos sobre los controles de mi familia.
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-xl bg-[#1F6B63] text-base font-bold text-white disabled:opacity-60"
      >
        {enviando ? "Guardando…" : "Seguir"}
      </button>

      {estado.error && (
        <p role="alert" className="rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {estado.error}
        </p>
      )}
    </form>
  );
}

// Botón de opción con forma de "pastilla" (radio button).
function Opcion(props: { name: string; value: string; texto: string; required?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={props.name} value={props.value} required={props.required} className="peer sr-only" />
      <span className="inline-flex h-11 items-center rounded-full border-2 border-zinc-300 px-4 text-base peer-checked:border-[#1F6B63] peer-checked:bg-[#E3F0EC] peer-checked:font-bold peer-focus-visible:outline peer-focus-visible:outline-2">
        {props.texto}
      </span>
    </label>
  );
}
