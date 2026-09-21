import type { ReactNode } from "react";
import BarraInferior from "./BarraInferior";

// El armazón que comparten las pantallas del diseño: título en mayúsculas
// pegado a la izquierda, subtítulo opcional, una acción redonda a la derecha
// (el "+" de los mockups) y la barra de pestañas abajo.
//
// El padding de abajo deja libre la altura de la barra para que el último
// elemento de una lista no quede tapado por ella.

interface Props {
  titulo: string;
  subtitulo?: string;
  accion?: { etiqueta: string; alTocar: () => void };
  children: ReactNode;
}

export default function Pantalla({ titulo, subtitulo, accion, children }: Props) {
  return (
    <div className="min-h-svh px-4 pb-28 pt-6" style={{ background: "var(--fondo)" }}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="titulo-pantalla text-3xl leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--texto)" }}>
              {subtitulo}
            </p>
          )}
        </div>
        {accion && (
          <button
            type="button"
            onClick={accion.alTocar}
            aria-label={accion.etiqueta}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-3xl leading-none"
            style={{ background: "var(--texto)", color: "var(--fondo)" }}
          >
            +
          </button>
        )}
      </header>
      {children}
      <BarraInferior />
    </div>
  );
}
