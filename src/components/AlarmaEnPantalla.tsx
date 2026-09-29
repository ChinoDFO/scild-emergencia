import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { callarSirena, sonarSirena } from "../services/sirena";

interface Alarma {
  titulo: string;
  cuerpo: string;
  groupId: string | null;
  recibidaA: Date;
  general: boolean;
}

// Cuánto se queda en pantalla una alerta de un tipo específico antes de
// cerrarse sola. El SOS y el botón físico NO usan este tiempo: se quedan
// fijos hasta que alguien los atiende o los silencia, porque no se puede dar
// por hecho que una emergencia real ya se vio.
const AUTOCIERRE_MS = 10_000;

// Solo el SOS y el botón físico hacen sonar la sirena y se quedan fijos en
// rojo. Los dos mandan una alerta GENERAL ("Emergencia"); los demás tipos del
// menú —carro sospechoso, incendio, emergencia médica...— sí se avisan en
// pantalla y por notificación, en amarillo y sin ruido: una sirena a todo
// volumen por una persona sospechosa en la esquina enseña a la gente a apagar
// la app, y entonces no suena cuando de verdad hace falta. El botón físico se
// acepta también por su origen, por si llega de un servidor que todavía no
// manda el tipo.
function esGeneral(datos: Record<string, string> | undefined) {
  return datos?.type === "GENERAL" || datos?.source === "DEVICE";
}

// Con la PWA abierta el navegador NO dibuja la notificación del sistema, así
// que sin esto una alerta que llega mientras alguien usa la app pasaría
// completamente desapercibida. Aquí es además el único lugar donde se puede
// hacer ruido de verdad: una página abierta sí puede tocar una sirena, una
// notificación del sistema no.
//
// Va montado en toda la app (no en una pantalla), porque la alerta puede
// llegar estando en cualquier parte.
export default function AlarmaEnPantalla() {
  const navigate = useNavigate();
  const [alarma, setAlarma] = useState<Alarma | null>(null);
  const autocierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return escucharAlertasEnPrimerPlano((payload) => {
      // Los mensajes del chat también llegan por aquí y no son una
      // emergencia: el chat ya los muestra solo.
      if (payload.data?.kind === "chat") return;

      const general = esGeneral(payload.data);

      setAlarma({
        titulo: payload.notification?.title ?? "🚨 Emergencia",
        cuerpo: payload.notification?.body ?? "Se activó una alerta en tu grupo",
        groupId: payload.data?.groupId ?? null,
        recibidaA: new Date(),
        general,
      });

      // El SOS y el botón físico se quedan fijos: no se puede dar por hecho
      // que ya se vieron. Una alerta de un tipo específico se cierra sola
      // para no quedarse estorbando la pantalla, y por eso NO insiste ni
      // reaparece: llega una vez, se lee, se va.
      if (autocierre.current) clearTimeout(autocierre.current);
      if (!general) {
        autocierre.current = setTimeout(() => setAlarma(null), AUTOCIERRE_MS);
      }

      // Las repeticiones de la misma alerta no reinician nada: si ya está
      // sonando, sonarSirena no hace nada. Y si la persona silenció la
      // sirena en Configuración, tampoco: sonarSirena lo respeta.
      if (general) sonarSirena();
    });
  }, []);

  // Si el componente se desmonta (cierre de sesión) no se queda sonando.
  useEffect(
    () => () => {
      callarSirena();
      if (autocierre.current) clearTimeout(autocierre.current);
    },
    []
  );

  if (!alarma) return null;

  const cerrar = () => {
    if (autocierre.current) clearTimeout(autocierre.current);
    callarSirena();
    setAlarma(null);
  };

  const ver = () => {
    const destino = alarma.groupId ? `/grupos/${alarma.groupId}` : "/";
    cerrar();
    navigate(destino);
  };

  // El SOS/botón físico se ve como una emergencia de verdad (rojo, late sin
  // parar); una alerta de un tipo específico avisa igual de claro pero en
  // amarillo, y sin el latido: ya sabemos que se va a cerrar sola.
  const colores = alarma.general
    ? {
        caja: "bg-red-600 text-white ring-1 ring-red-900/20 motion-safe:animate-[latido_1.2s_ease-out_infinite]",
        cuerpo: "text-red-50",
        hora: "text-red-200",
        ver: "bg-white text-red-700 hover:bg-red-50",
        cerrar: "bg-red-800 text-white hover:bg-red-900",
      }
    : {
        caja: "bg-amber-400 text-amber-950 ring-1 ring-amber-700/20",
        cuerpo: "text-amber-900",
        hora: "text-amber-800",
        ver: "bg-white text-amber-800 hover:bg-amber-50",
        cerrar: "bg-amber-600 text-amber-950 hover:bg-amber-700",
      };

  return (
    <div
      role="alertdialog"
      aria-label={alarma.titulo}
      className="fixed inset-x-0 top-0 z-50 flex justify-center p-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className={`w-full max-w-lg rounded-2xl p-4 shadow-2xl ${colores.caja}`}>
        <p className="text-lg font-bold">{alarma.titulo}</p>
        <p className={`text-sm ${colores.cuerpo}`}>{alarma.cuerpo}</p>
        <p className={`mt-1 text-xs ${colores.hora}`}>
          {alarma.recibidaA.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={ver}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${colores.ver}`}
          >
            Ver alerta
          </button>
          <button
            onClick={cerrar}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${colores.cerrar}`}
          >
            Silenciar
          </button>
        </div>
      </div>
    </div>
  );
}
