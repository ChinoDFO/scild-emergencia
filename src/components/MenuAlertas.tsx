import { useEffect, useState } from "react";
import { generarAlerta, listarTiposAlerta, type TipoAlerta } from "../services/api";

// Si el catálogo no carga (sin red, backend dormido) igual se debe poder
// pedir ayuda: queda al menos la alerta general.
const RESPALDO: TipoAlerta[] = [{ id: "GENERAL", etiqueta: "Emergencia", emoji: "🚨" }];

// Fondo de cada círculo, por posición en el catálogo.
const FONDOS = ["bg-red-100", "bg-amber-100", "bg-violet-100", "bg-sky-100", "bg-orange-100", "bg-emerald-100"];

interface Props {
  groupId: string;
  groupName: string;
  alCerrar: () => void;
  alEnviar: () => void;
}

// Panel "¿Qué está pasando?" que sale sobre la caja de mensaje al tocar el
// botón "!". Al elegir una opción la alerta sale de inmediato.
export default function MenuAlertas({ groupId, groupName, alCerrar, alEnviar }: Props) {
  const [tipos, setTipos] = useState<TipoAlerta[]>(RESPALDO);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarTiposAlerta()
      .then(setTipos)
      .catch(() => setTipos(RESPALDO));
  }, []);

  useEffect(() => {
    const conEscape = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", conEscape);
    return () => window.removeEventListener("keydown", conEscape);
  }, [alCerrar]);

  const enviar = async (tipo: TipoAlerta) => {
    setEnviando(tipo.id);
    setError(null);
    try {
      await generarAlerta(groupId, tipo.id);
      navigator.vibrate?.(120);
      alEnviar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Enviar una alerta"
      className="mx-2 mb-2 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-slate-900">¿Qué está pasando?</h2>
        <span className="text-xs text-slate-500">Se avisa al instante</span>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4">
        {tipos.map((tipo, i) => (
          <li key={tipo.id}>
            <button
              onClick={() => enviar(tipo)}
              disabled={enviando !== null}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl p-1 text-center disabled:opacity-50"
            >
              <span
                className={`flex size-14 items-center justify-center rounded-full text-3xl ${FONDOS[i % FONDOS.length]} ${
                  enviando === tipo.id ? "animate-pulse" : ""
                }`}
                aria-hidden
              >
                {tipo.emoji}
              </span>
              <span className="text-xs font-medium leading-tight text-slate-700">{tipo.etiqueta}</span>
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">No se pudo enviar: {error}</p>
      ) : (
        <p className="mt-3 text-center text-xs text-slate-500">Le llega a todos los de {groupName}.</p>
      )}
    </div>
  );
}
