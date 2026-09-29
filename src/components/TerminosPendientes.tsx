import { useState } from "react";
import ContenidoLegal from "./ContenidoLegal";
import { aceptarTerminos } from "../services/api";
import { PRIVACIDAD, TERMINOS } from "../data/legal";

type Pestana = "terminos" | "privacidad";

// Bloquea el resto de la app hasta que la cuenta acepta los Términos y el
// Aviso de Privacidad: la primera vez que se registra, y también para
// cuentas de antes de que existiera esta pantalla (terminosAceptadosEl
// llega null de cualquiera de las dos). No tiene botón de "cerrar" ni
// "saltar" a propósito: aceptar no es opcional para usar el servicio.
export default function TerminosPendientes({ alAceptar }: { alAceptar: () => void }) {
  const [pestana, setPestana] = useState<Pestana>("terminos");
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aceptar = async () => {
    setEnviando(true);
    setError(null);
    try {
      await aceptarTerminos();
      alAceptar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar tu aceptación");
      setEnviando(false);
    }
  };

  const pestanas: { id: Pestana; etiqueta: string }[] = [
    { id: "terminos", etiqueta: "Términos" },
    { id: "privacidad", etiqueta: "Privacidad" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--fondo)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Términos y condiciones"
    >
      <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="titulo-pantalla text-2xl">Antes de seguir</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
          Lee y acepta los Términos y Condiciones y el Aviso de Privacidad para usar SCILD.
        </p>

        <div className="tarjeta mt-4 flex p-1">
          {pestanas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPestana(p.id)}
              aria-pressed={pestana === p.id}
              className="flex-1 rounded-xl py-2 text-[11px] font-bold uppercase transition"
              style={{
                background: pestana === p.id ? "var(--texto)" : "transparent",
                color: pestana === p.id ? "var(--fondo)" : "var(--texto-tenue)",
              }}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <ContenidoLegal secciones={pestana === "terminos" ? TERMINOS : PRIVACIDAD} />
      </div>

      <div
        className="space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3"
        style={{ borderTop: "2px solid var(--borde)", background: "var(--fondo)" }}
      >
        {error && (
          <p className="text-sm font-bold" style={{ color: "var(--peligro)" }}>
            {error}
          </p>
        )}

        <label className="flex items-start gap-2.5 text-sm" style={{ color: "var(--texto)" }}>
          <input
            type="checkbox"
            checked={marcado}
            onChange={(e) => setMarcado(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          He leído y acepto los Términos y Condiciones y el Aviso de Privacidad.
        </label>

        <button
          type="button"
          disabled={!marcado || enviando}
          onClick={aceptar}
          className="w-full rounded-full py-3 text-sm font-bold uppercase disabled:opacity-50"
          style={{ background: "var(--texto)", color: "var(--fondo)" }}
        >
          {enviando ? "Guardando…" : "Acepto y continuar"}
        </button>
      </div>
    </div>
  );
}
