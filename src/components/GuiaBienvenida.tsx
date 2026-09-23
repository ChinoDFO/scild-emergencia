import { useState } from "react";

// Guía corta para quien acaba de crear su cuenta.
//
// Se abre sola la primera vez y se puede saltar; después vive en Ayuda, para
// quien la quiera volver a ver. Son cuatro pasos y no cinco ni diez: lo que
// hay que entender antes de usar la app es poco, y una guía larga se salta
// entera.
//
// Lo que sí tiene que quedar claro desde el principio es la diferencia entre
// las dos clases de cuenta, porque es la pregunta que llega después ("¿por
// qué no me aparece el botón de emergencia?").

export const PASOS = [
  {
    titulo: "Bienvenido a SCILD",
    cuerpo:
      "Esta app es el panel de tu botón de emergencia. Desde aquí avisas a tu grupo, ves las alertas y hablas con los demás.",
  },
  {
    titulo: "Dos tipos de cuenta",
    cuerpo:
      "Con el código de tu botón, tu cuenta puede ENVIAR alertas. Sin él entras como invitado: recibes todas las alertas y escribes en el chat, pero no puedes dispararlas.",
  },
  {
    titulo: "Tu botón",
    cuerpo:
      "El código viene impreso en la caja y sirve para tres personas: las que viven o trabajan donde está el aparato. Se captura en Códigos, o al crear tu cuenta.",
  },
  {
    titulo: "Tus grupos",
    cuerpo:
      "Un grupo es quién se entera de tus emergencias. Lo creas tú, o entras a uno con el código de invitación que te compartan. El administrador decide cuánta gente cabe.",
  },
  {
    titulo: "La alerta",
    cuerpo:
      "Mantén presionado el botón SOS un segundo, o elige un tipo de emergencia. A todo el grupo le llega el aviso, suena aunque la app esté cerrada, e insiste hasta que alguien responde.",
  },
];

export default function GuiaBienvenida({ alCerrar }: { alCerrar: () => void }) {
  const [paso, setPaso] = useState(0);
  const actual = PASOS[paso];
  const ultimo = paso === PASOS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Guía de bienvenida"
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: "var(--fondo)", border: "2px solid var(--borde)" }}
      >
        <p className="text-xs font-bold uppercase" style={{ color: "var(--texto-tenue)" }}>
          Paso {paso + 1} de {PASOS.length}
        </p>
        <h2 className="titulo-pantalla mt-1 text-2xl">{actual.titulo}</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--texto)" }}>
          {actual.cuerpo}
        </p>

        {/* Los puntos dicen cuánto falta: sin eso, "Siguiente" parece infinito. */}
        <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
          {PASOS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === paso ? 20 : 6,
                background: i === paso ? "var(--texto)" : "var(--borde-tenue)",
              }}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={alCerrar}
            className="flex-1 rounded-full py-2.5 text-sm font-bold uppercase"
            style={{ background: "var(--superficie)", color: "var(--texto)" }}
          >
            {ultimo ? "Cerrar" : "Saltar"}
          </button>
          {!ultimo && (
            <button
              type="button"
              onClick={() => setPaso((p) => p + 1)}
              className="flex-1 rounded-full py-2.5 text-sm font-bold uppercase"
              style={{ background: "var(--texto)", color: "var(--fondo)" }}
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Se recuerda por cuenta y no a secas, porque un aparato puede ser de dos
// personas: si el segundo entra y ya no ve la guía, la pierde para siempre.
const clave = (uid: string) => `scild:guia:${uid}`;

export function guiaYaVista(uid: string) {
  try {
    return localStorage.getItem(clave(uid)) === "1";
  } catch {
    // Ventana privada o almacenamiento bloqueado: se da por vista, que es
    // menos molesto que enseñarla en cada arranque.
    return true;
  }
}

export function marcarGuiaVista(uid: string) {
  try {
    localStorage.setItem(clave(uid), "1");
  } catch {
    /* que no se guarde no es motivo para romper la pantalla */
  }
}
