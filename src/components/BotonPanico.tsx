import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { generarAlerta } from "../services/api";

// Cuánto hay que mantenerlo presionado. Es un solo gesto (inmediato, sin
// menú ni "¿confirmas?"), pero un roce accidental con el celular en la bolsa
// no alcanza a disparar una alerta que despierta a todo el grupo.
const MANTENER_MS = 1000;

const RADIO = 58;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

type Estado = "listo" | "presionando" | "enviando" | "enviada" | "error";

interface Props {
  groupId: string;
  alEnviar?: () => void;
}

export default function BotonPanico({ groupId, alEnviar }: Props) {
  const [estado, setEstado] = useState<Estado>("listo");
  const [progreso, setProgreso] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inicio = useRef<number | null>(null);
  const cuadro = useRef<number | null>(null);
  // Quien dispara la alerta es este temporizador, no la animación: el
  // navegador pausa requestAnimationFrame si la página no está visible, y una
  // alerta no puede depender de que se dibuje el anillo.
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reinicio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (cuadro.current) cancelAnimationFrame(cuadro.current);
      if (temporizador.current) clearTimeout(temporizador.current);
      if (reinicio.current) clearTimeout(reinicio.current);
    },
    []
  );

  const disparar = async () => {
    setEstado("enviando");
    navigator.vibrate?.([120, 60, 120]);
    try {
      await generarAlerta(groupId, "GENERAL");
      setEstado("enviada");
      alEnviar?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar");
      setEstado("error");
    }
    setProgreso(0);
    reinicio.current = setTimeout(() => {
      setEstado("listo");
      setError(null);
    }, 5000);
  };

  // Solo dibuja el anillo.
  const avanzar = () => {
    if (inicio.current === null) return;
    setProgreso(Math.min(1, (performance.now() - inicio.current) / MANTENER_MS));
    cuadro.current = requestAnimationFrame(avanzar);
  };

  const completar = () => {
    inicio.current = null;
    if (cuadro.current) cancelAnimationFrame(cuadro.current);
    setProgreso(1);
    disparar();
  };

  const empezar = () => {
    if (estado === "enviando" || inicio.current !== null) return;
    if (reinicio.current) clearTimeout(reinicio.current);
    setError(null);
    setEstado("presionando");
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
    setEstado("listo");
  };

  const conTeclado = (e: KeyboardEvent, bajando: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (bajando && !e.repeat) empezar();
    if (!bajando) cancelar();
  };

  const texto = {
    listo: "Mantén presionado para pedir ayuda",
    presionando: "Sigue presionando…",
    enviando: "Enviando alerta…",
    enviada: "✓ Alerta enviada a todo el grupo",
    error: error ? `No se pudo enviar: ${error}` : "No se pudo enviar",
  }[estado];

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <div className="relative size-32">
        {/* Halo que late mientras está en reposo, para que se note que es EL botón. */}
        {estado === "listo" && (
          <span className="absolute inset-3 rounded-full bg-red-500/40 motion-safe:animate-[latido_2.4s_ease-out_infinite]" />
        )}

        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128" aria-hidden>
          <circle cx="64" cy="64" r={RADIO} fill="none" stroke="rgb(254 202 202)" strokeWidth="6" />
          <circle
            cx="64"
            cy="64"
            r={RADIO}
            fill="none"
            stroke="rgb(185 28 28)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
          />
        </svg>

        <button
          type="button"
          aria-label={`Botón de emergencia: mantén presionado un segundo para avisar a todo el grupo. ${texto}`}
          disabled={estado === "enviando"}
          onPointerDown={(e) => {
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
          onKeyDown={(e) => conTeclado(e, true)}
          onKeyUp={(e) => conTeclado(e, false)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: "none" }}
          className={`absolute inset-3 flex touch-none select-none flex-col items-center justify-center rounded-full text-white shadow-lg shadow-red-300 transition-transform duration-150 ${
            estado === "enviada" ? "bg-emerald-600" : "bg-red-600"
          } ${estado === "presionando" ? "scale-95 bg-red-700" : ""}`}
        >
          <span className="text-3xl font-black tracking-wider">{estado === "enviada" ? "✓" : "SOS"}</span>
        </button>
      </div>

      <p
        role="status"
        className={`text-sm font-medium ${
          estado === "error" ? "text-red-700" : estado === "enviada" ? "text-emerald-700" : "text-slate-600"
        }`}
      >
        {texto}
      </p>
    </div>
  );
}
