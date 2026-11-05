"use client";

// Botón de borrar con pregunta de confirmación, para no borrar a nadie sin querer.
import { borrarIntegrante } from "./acciones";

export function BotonBorrar({ id, nombre }: { id: string; nombre: string }) {
  return (
    <form
      action={borrarIntegrante}
      onSubmit={(e) => {
        if (!window.confirm(`¿Sacar a ${nombre} de tu familia?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm font-semibold text-[#A3262D] underline">
        Sacar
      </button>
    </form>
  );
}
