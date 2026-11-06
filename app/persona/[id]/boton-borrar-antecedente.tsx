"use client";

import { borrarAntecedente } from "./antecedentes-acciones";

export function BotonBorrarAntecedente({ id }: { id: string }) {
  return (
    <form
      action={borrarAntecedente}
      onSubmit={(e) => {
        if (!window.confirm("¿Borrar este antecedente?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-semibold text-[#A3262D] underline">
        Borrar
      </button>
    </form>
  );
}
