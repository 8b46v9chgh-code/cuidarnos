"use client";

// Formulario para agregar o editar un integrante.
import { useActionState } from "react";
import Link from "next/link";
import { guardarIntegrante, type EstadoIntegrante } from "./acciones";
import type { Integrante } from "@/lib/familia";

const inicial: EstadoIntegrante = { error: null };
const campo =
  "h-12 rounded-xl border border-zinc-300 px-3 text-base font-normal outline-none focus:border-[#1F6B63]";
const etiqueta = "flex flex-col gap-1 text-sm font-semibold";

export function FormularioIntegrante({ integrante }: { integrante?: Integrante }) {
  const [estado, accion, enviando] = useActionState(guardarIntegrante, inicial);
  const editando = Boolean(integrante);

  return (
    // "key" hace que el formulario se vacíe al pasar de editar a agregar.
    <form key={integrante?.id ?? "nuevo"} action={accion} className="flex flex-col gap-5">
      <h2 className="text-lg font-extrabold">{editando ? `Editar a ${integrante!.nombre}` : "Agregar a alguien"}</h2>
      {integrante && <input type="hidden" name="id" value={integrante.id} />}

      <label className={etiqueta}>
        Nombre
        <input name="nombre" required maxLength={60} defaultValue={integrante?.nombre} className={campo} />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">¿Quién es?</legend>
        <div className="flex flex-wrap gap-2">
          <Opcion name="parentesco" value="pareja" texto="Pareja" actual={integrante?.parentesco} required />
          <Opcion name="parentesco" value="hijo" texto="Hijo/a" actual={integrante?.parentesco} required />
          <Opcion name="parentesco" value="madre" texto="Madre" actual={integrante?.parentesco} required />
          <Opcion name="parentesco" value="padre" texto="Padre" actual={integrante?.parentesco} required />
        </div>
      </fieldset>

      <label className={etiqueta}>
        Fecha de nacimiento
        <input
          name="fecha_nacimiento"
          type="date"
          required
          min="1900-01-01"
          defaultValue={integrante?.fecha_nacimiento}
          className={campo}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Sexo</legend>
        <div className="flex gap-2">
          <Opcion name="sexo" value="F" texto="Mujer" actual={integrante?.sexo} required />
          <Opcion name="sexo" value="M" texto="Varón" actual={integrante?.sexo} required />
        </div>
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl bg-[#F3F6F4] p-3 text-base">
        <input
          name="a_cargo"
          type="checkbox"
          defaultChecked={integrante?.a_cargo ?? true}
          className="mt-1 h-5 w-5 accent-[#1F6B63]"
        />
        <span>
          <strong>Está a mi cargo.</strong> Recibo sus avisos y anoto sus estudios.
        </span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="h-12 rounded-xl bg-[#1F6B63] text-base font-bold text-white disabled:opacity-60"
      >
        {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Agregar"}
      </button>
      {editando && (
        <Link href="/familia" className="text-center text-sm font-semibold text-[#1F6B63] underline">
          Cancelar
        </Link>
      )}

      {estado.error && (
        <p role="alert" className="rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {estado.error}
        </p>
      )}
    </form>
  );
}

function Opcion(props: { name: string; value: string; texto: string; actual?: string; required?: boolean }) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={props.name}
        value={props.value}
        required={props.required}
        defaultChecked={props.actual === props.value}
        className="peer sr-only"
      />
      <span className="inline-flex h-11 items-center rounded-full border-2 border-zinc-300 px-4 text-base peer-checked:border-[#1F6B63] peer-checked:bg-[#E3F0EC] peer-checked:font-bold peer-focus-visible:outline peer-focus-visible:outline-2">
        {props.texto}
      </span>
    </label>
  );
}
