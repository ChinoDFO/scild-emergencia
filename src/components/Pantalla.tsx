import type { ReactNode } from "react";
import BarraInferior from "./BarraInferior";
import { useTema } from "../context/TemaContext";

// El armazón que comparten las pantallas del diseño: título en mayúsculas
// pegado a la izquierda, subtítulo opcional, una acción redonda a la derecha
// (el "+" de los mockups), el logo discreto, y la barra de pestañas abajo.
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
  const { tema } = useTema();
  const logo = tema === "oscuro" ? "/logo-oscuro.png" : "/logo-claro.png";

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
        {/* Marca discreta de SCILD: en todas las pantallas que usan este
            armazón, menos en el chat (Grupo.tsx no pasa por aquí, tiene su
            propio encabezado). */}
        <img src={logo} alt="" aria-hidden className="h-8 w-8 shrink-0 opacity-45" />
        {accion && (
          <button
            type="button"
            onClick={accion.alTocar}
            aria-label={accion.etiqueta}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--texto)", color: "var(--fondo)" }}
          >
            {/* SVG y no el carácter "+": el glifo de texto no queda centrado
                de verdad en el círculo (su caja tiene más aire abajo que
                arriba), así que se veía corrido hacia abajo. */}
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </header>
      {children}
      <BarraInferior />
    </div>
  );
}
