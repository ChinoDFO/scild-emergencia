import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// El botón de emergencia: el círculo oscuro del centro de la barra de abajo.
//
// Vive ahí y no dentro del chat a propósito. Antes era un círculo rojo enorme
// arriba de la conversación, así que para pedir ayuda había que entrar al
// grupo primero; en la barra está en todas las pantallas y a una mano de
// distancia. Quién recibe la alerta lo resuelve BarraInferior.
//
// Se mantiene presionado un segundo: es un solo gesto (sin menú ni
// "¿confirmas?"), pero un roce con el celular en la bolsa no alcanza a
// despertar a todo el grupo.

const MANTENER_MS = 1000;

// El anillo se dibuja sobre el borde del círculo de 64px.
const RADIO = 29;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

export type EstadoSOS = "listo" | "enviando" | "enviada";

interface Props {
  // Se llama cuando se completó el segundo de presión.
  alMantener: () => void;
  estado: EstadoSOS;
  // Sin acceso completo el botón no se mantiene: un toque explica por qué.
  bloqueado?: boolean;
  alToqueBloqueado?: () => void;
}

export default function BotonPanico({ alMantener, estado, bloqueado, alToqueBloqueado }: Props) {
  const [progreso, setProgreso] = useState(0);
  const inicio = useRef<number | null>(null);
  const cuadro = useRef<number | null>(null);
  // Quien dispara la alerta es este temporizador, no la animación: el
  // navegador pausa requestAnimationFrame si la página no está visible, y una
  // alerta no puede depender de que se dibuje el anillo.
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (cuadro.current) cancelAnimationFrame(cuadro.current);
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    []
  );

  // Solo dibuja el anillo.
  const avanzar = () => {
    if (inicio.current === null) return;
    setProgreso(Math.min(1, (performance.now() - inicio.current) / MANTENER_MS));
    cuadro.current = requestAnimationFrame(avanzar);
  };

  const completar = () => {
    inicio.current = null;
    if (cuadro.current) cancelAnimationFrame(cuadro.current);
    setProgreso(0);
    alMantener();
  };

  const empezar = () => {
    if (bloqueado || estado === "enviando" || inicio.current !== null) return;
    navigator.vibrate?.(30);
    inicio.current = performance.now();
    temporizador.current = setTimeout(completar, MANTENER_MS);
    cuadro.current = requestAnimationFrame(avanzar);
  };

  // Soltó antes de tiempo: no pasa nada.
  const cancelar = () => {
    if (inicio.current === null) return;
    inicio.current = null;
    if (temporizador.current) clearTimeout(temporizador.current);
    if (cuadro.current) cancelAnimationFrame(cuadro.current);
    setProgreso(0);
  };

  const conTeclado = (e: KeyboardEvent, bajando: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (bloqueado) {
      if (bajando && !e.repeat) alToqueBloqueado?.();
      return;
    }
    if (bajando && !e.repeat) empezar();
    if (!bajando) cancelar();
  };

  const presionando = progreso > 0;
  const glifo = estado === "enviada" ? "✓" : estado === "enviando" ? "···" : "SOS";

  return (
    <div className="relative -mt-6 h-16 w-16 shrink-0">
      {/* Halo que late en reposo, para que se note que es EL botón. */}
      {estado === "listo" && !bloqueado && !presionando && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-[latido_2.4s_ease-out_infinite]"
          style={{ background: "var(--emergencia)", opacity: 0.35 }}
        />
      )}

      <button
        type="button"
        aria-label={
          bloqueado
            ? "Botón de emergencia: tu cuenta todavía no puede enviar alertas"
            : "Botón de emergencia: mantén presionado un segundo para avisar a tu grupo"
        }
        disabled={estado === "enviando"}
        onPointerDown={(e) => {
          if (bloqueado) return;
          // Capturar el puntero: si el dedo se desliza un poco fuera del
          // círculo no se cancela; solo al soltar.
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Algunos navegadores no lo permiten para ciertos punteros.
          }
          empezar();
        }}
        onPointerUp={cancelar}
        onPointerCancel={cancelar}
        onLostPointerCapture={cancelar}
        onClick={() => bloqueado && alToqueBloqueado?.()}
        onKeyDown={(e) => conTeclado(e, true)}
        onKeyUp={(e) => conTeclado(e, false)}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          background: "var(--emergencia)",
          color: "var(--fondo)",
          border: "3px solid var(--borde)",
          boxShadow: `0 4px 12px var(--sombra)`,
          opacity: bloqueado ? 0.45 : 1,
          WebkitTouchCallout: "none",
        }}
        className={`absolute inset-0 flex touch-none select-none items-center justify-center rounded-full text-sm font-black tracking-wider transition-transform duration-150 ${
          presionando ? "scale-95" : ""
        }`}
      >
        {glifo}
      </button>

      {/* Anillo de avance: solo aparece mientras se mantiene presionado. */}
      {presionando && (
        <svg
          className="pointer-events-none absolute inset-0 -rotate-90"
          viewBox="0 0 64 64"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r={RADIO}
            fill="none"
            stroke="var(--alerta)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
          />
        </svg>
      )}
    </div>
  );
}
