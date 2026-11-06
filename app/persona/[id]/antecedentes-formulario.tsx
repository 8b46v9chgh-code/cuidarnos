"use client";

// Formulario para cargar un antecedente familiar.
// Las preguntas cambian según lo que se elige: órgano para cáncer, tipo para diabetes,
// lado para abuelos y tíos, y la pregunta de edad con el corte de esa enfermedad.
import { useActionState, useState } from "react";
import { corteEdad, type Enfermedad, type Organo, type ParentescoFamiliar } from "@/lib/antecedentes";
import {
  ENFERMEDADES,
  PARENTESCOS,
  SINDROMES,
  TIPOS_DIABETES,
  organosPara,
  preguntaEdad,
  preguntaLado,
} from "@/lib/antecedentes-textos";
import { guardarAntecedente, type EstadoAntecedente } from "./antecedentes-acciones";

const campo = "h-11 rounded-xl border border-zinc-300 bg-white px-3 text-base font-normal outline-none focus:border-[#1F6B63]";
const etiqueta = "flex flex-col gap-1 text-sm font-semibold";

export function FormularioAntecedente({ integranteId, nombre }: { integranteId: string; nombre: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion, enviando] = useActionState(guardarAntecedente, { error: null } as EstadoAntecedente);
  const [parentesco, setParentesco] = useState<ParentescoFamiliar | "">("");
  const [enfermedad, setEnfermedad] = useState<Enfermedad | "">("");
  const [organo, setOrgano] = useState<Organo | "">("");

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="h-11 rounded-xl bg-[#1F6B63] px-4 text-sm font-bold text-white"
      >
        Agregar un antecedente
      </button>
    );
  }

  const organos = parentesco ? organosPara(parentesco) : [];
  // Si cambia el familiar y el órgano elegido ya no está en su lista (ej.: próstata → madre), se limpia.
  const organoValido = organos.some(([o]) => o === organo) ? organo : "";
  const corte = parentesco && enfermedad && preguntaEdad(enfermedad) ? corteEdad(enfermedad, organoValido || null, parentesco) : null;
  const pideDetalle = enfermedad === "otra" || organoValido === "otro";

  return (
    <form action={accion} className="flex flex-col gap-4 rounded-xl bg-[#F3F6F4] p-4">
      <input type="hidden" name="integrante_id" value={integranteId} />

      <label className={etiqueta}>
        ¿Quién lo tuvo? (familiar de {nombre})
        <select
          name="parentesco"
          required
          value={parentesco}
          onChange={(e) => setParentesco(e.target.value as ParentescoFamiliar)}
          className={campo}
        >
          <option value="" disabled>
            Elegí
          </option>
          {PARENTESCOS.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {parentesco && preguntaLado(parentesco) && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">¿De qué lado de la familia?</legend>
          <div className="flex flex-wrap gap-2">
            <Opcion name="lado" value="paterno" texto="Paterno" />
            <Opcion name="lado" value="materno" texto="Materno" />
            <Opcion name="lado" value="" texto="No sé" />
          </div>
        </fieldset>
      )}

      {parentesco && (
        <label className={etiqueta}>
          ¿Qué tuvo?
          <select
            name="enfermedad"
            required
            value={enfermedad}
            onChange={(e) => setEnfermedad(e.target.value as Enfermedad)}
            className={campo}
          >
            <option value="" disabled>
              Elegí
            </option>
            {ENFERMEDADES.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}

      {enfermedad === "cancer" && (
        <label className={etiqueta}>
          ¿De qué órgano?
          <select name="organo" required value={organoValido} onChange={(e) => setOrgano(e.target.value as Organo)} className={campo}>
            <option value="" disabled>
              Elegí
            </option>
            {organos.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}

      {enfermedad === "diabetes" && (
        <label className={etiqueta}>
          ¿De qué tipo?
          <select name="tipo_diabetes" required defaultValue="" className={campo}>
            <option value="" disabled>
              Elegí
            </option>
            {TIPOS_DIABETES.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}

      {enfermedad === "sindrome" && (
        <label className={etiqueta}>
          ¿Cuál?
          <select name="sindrome" required defaultValue="" className={campo}>
            <option value="" disabled>
              Elegí
            </option>
            {SINDROMES.map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      )}

      {corte !== null && (enfermedad !== "cancer" || organoValido) && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">¿Tenía menos de {corte} años cuando se lo diagnosticaron?</legend>
          <div className="flex flex-wrap gap-2">
            <Opcion name="edad_respuesta" value="antes" texto="Sí" />
            <Opcion name="edad_respuesta" value="despues" texto="No" />
            <Opcion name="edad_respuesta" value="no_se" texto="No sé" />
          </div>
          <p className="text-xs text-zinc-500">Si no sabés, la app toma el caso más joven, que es el de más riesgo.</p>
        </fieldset>
      )}

      {enfermedad && (
        <label className={etiqueta}>
          {pideDetalle ? "¿Cuál fue?" : "Aclaración (opcional)"}
          <input name="detalle" maxLength={200} required={pideDetalle} className={campo} />
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || !enfermedad}
          className="h-11 flex-1 rounded-xl bg-[#1F6B63] text-sm font-bold text-white disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="h-11 px-3 text-sm font-semibold text-[#1F6B63] underline">
          Cancelar
        </button>
      </div>
      {estado.error && (
        <p role="alert" className="rounded-xl bg-[#FDE4E4] p-3 text-sm text-[#8E1F26]">
          {estado.error}
        </p>
      )}
    </form>
  );
}

// Botón tipo "chip" para respuestas cortas (sí / no / no sé).
function Opcion({ name, value, texto }: { name: string; value: string; texto: string }) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} required className="peer sr-only" />
      <span className="inline-flex h-10 items-center rounded-full border border-zinc-300 bg-white px-4 text-sm font-semibold peer-checked:border-[#1F6B63] peer-checked:bg-[#E3F0EC] peer-checked:text-[#1F6B63] peer-focus-visible:outline-2">
        {texto}
      </span>
    </label>
  );
}
