import { useEffect, useState } from "react";
import { generarAlerta, listarTiposAlerta, type TipoAlerta } from "../services/api";

// Si el catálogo no carga (sin red, backend dormido) igual se debe poder
// pedir ayuda: queda al menos la alerta general.
const RESPALDO: TipoAlerta[] = [{ id: "GENERAL", etiqueta: "Emergencia", emoji: "🚨" }];

interface Props {
  groupId: string;
  groupName: string;
  alCerrar: () => void;
  alEnviar: () => void;
}

// Panel "¿Qué está pasando?" que sale sobre la caja de mensaje al tocar el
// botón amarillo "!". Al elegir una opción la alerta sale de inmediato.
//
// Va con el trazo y la superficie del resto de la app: los círculos de los
// tipos son piezas con contorno, y el color lo pone el emoji, no un relleno
// pastel distinto en cada uno.
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
    <div role="dialog" aria-label="Enviar una alerta" className="tarjeta mx-2 mb-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
            ¿Qué está pasando?
          </h2>
          <p className="text-[11px]" style={{ color: "var(--texto-tenue)" }}>
            Se avisa al instante, sin confirmar.
          </p>
        </div>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar menú de alertas"
          className="rounded-full border-2 px-2 py-0.5 text-sm font-black leading-none"
          style={{ borderColor: "var(--borde)", color: "var(--texto)", background: "var(--fondo)" }}
        >
          ×
        </button>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-x-2 gap-y-3">
        {tipos.map((tipo) => (
          <li key={tipo.id}>
            <button
              onClick={() => enviar(tipo)}
              disabled={enviando !== null}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl p-1 text-center disabled:opacity-50"
            >
              <span
                className={`flex size-14 items-center justify-center rounded-full border-2 text-3xl ${
                  enviando === tipo.id ? "animate-pulse" : ""
                }`}
                style={{ background: "var(--fondo)", borderColor: "var(--borde)" }}
                aria-hidden
              >
                {tipo.emoji}
              </span>
              <span className="text-[11px] font-bold uppercase leading-tight" style={{ color: "var(--texto)" }}>
                {tipo.etiqueta}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p className="mt-3 text-sm font-bold" style={{ color: "var(--peligro)" }}>
          No se pudo enviar: {error}
        </p>
      ) : (
        <p className="mt-3 text-center text-[11px]" style={{ color: "var(--texto-tenue)" }}>
          Le llega a todos los de {groupName}.
        </p>
      )}
    </div>
  );
}
