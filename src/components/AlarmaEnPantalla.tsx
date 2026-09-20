import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { callarSirena, sonarSirena } from "../services/sirena";

interface Alarma {
  titulo: string;
  cuerpo: string;
  groupId: string | null;
  recibidaA: Date;
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

  useEffect(() => {
    return escucharAlertasEnPrimerPlano((payload) => {
      // Los mensajes del chat también llegan por aquí y no son una
      // emergencia: el chat ya los muestra solo.
      if (payload.data?.kind === "chat") return;

      setAlarma({
        titulo: payload.notification?.title ?? "🚨 Emergencia",
        cuerpo: payload.notification?.body ?? "Se activó una alerta en tu grupo",
        groupId: payload.data?.groupId ?? null,
        recibidaA: new Date(),
      });
      // Las repeticiones de la misma alerta no reinician nada: si ya está
      // sonando, sonarSirena no hace nada.
      sonarSirena();
    });
  }, []);

  // Si el componente se desmonta (cierre de sesión) no se queda sonando.
  useEffect(() => callarSirena, []);

  if (!alarma) return null;

  const cerrar = () => {
    callarSirena();
    setAlarma(null);
  };

  const ver = () => {
    const destino = alarma.groupId ? `/grupos/${alarma.groupId}` : "/";
    cerrar();
    navigate(destino);
  };

  return (
    <div
      role="alertdialog"
      aria-label={alarma.titulo}
      className="fixed inset-x-0 top-0 z-50 flex justify-center p-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className="w-full max-w-lg rounded-2xl bg-red-600 p-4 text-white shadow-2xl ring-1 ring-red-900/20 motion-safe:animate-[latido_1.2s_ease-out_infinite]">
        <p className="text-lg font-bold">{alarma.titulo}</p>
        <p className="text-sm text-red-50">{alarma.cuerpo}</p>
        <p className="mt-1 text-xs text-red-200">
          {alarma.recibidaA.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={ver}
            className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            Ver alerta
          </button>
          <button
            onClick={cerrar}
            className="rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900"
          >
            Silenciar
          </button>
        </div>
      </div>
    </div>
  );
}
