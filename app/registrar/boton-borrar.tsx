"use client";

import { borrarControl } from "./acciones";

export function BotonBorrarControl({ id }: { id: string }) {
  return (
    <form
      action={borrarControl}
      onSubmit={(e) => {
        if (!window.confirm("¿Borrar este control? Si tiene informe, también se borra.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-semibold text-[#A3262D] underline">
        Borrar
      </button>
    </form>
  );
}
