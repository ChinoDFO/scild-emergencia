import { useEffect, useState } from "react";
import {
  activarNotificaciones,
  escucharAlertasEnPrimerPlano,
  estadoNotificaciones,
  type EstadoNotificaciones,
} from "../services/notificaciones";

interface AlertaRecibida {
  titulo: string;
  cuerpo: string;
  recibidaA: Date;
}

export default function Notificaciones() {
  const [estado, setEstado] = useState<EstadoNotificaciones | null>(null);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAlerta, setUltimaAlerta] = useState<AlertaRecibida | null>(null);

  useEffect(() => {
    (async () => {
      const actual = await estadoNotificaciones();
      setEstado(actual);

      // Tener el permiso del navegador NO significa que el backend tenga el
      // token: el permiso pudo concederse en una sesión anterior, o el token
      // pudo borrarse al cerrar sesión o rotar. Como el permiso ya está dado,
      // esto no abre ningún diálogo — solo vuelve a registrarlo (el backend
      // hace upsert, así que repetirlo es inofensivo).
      if (actual === "activadas") {
        try {
          await activarNotificaciones();
        } catch (e) {
          setError(
            e instanceof Error
              ? `Tienes el permiso concedido, pero el token no se pudo registrar: ${e.message}`
              : "El token de notificaciones no se pudo registrar"
          );
        }
      }
    })();
  }, []);

  // Con la app abierta el navegador no dibuja el aviso del sistema, así que la
  // alerta se muestra aquí dentro.
  useEffect(() => {
    return escucharAlertasEnPrimerPlano((payload) => {
      // Los mensajes del chat también llegan por aquí, pero no son una
      // emergencia: el chat ya los muestra solo.
      if (payload.data?.kind === "chat") return;

      setUltimaAlerta({
        titulo: payload.notification?.title ?? "🚨 Emergencia",
        cuerpo: payload.notification?.body ?? "Se activó una alerta en tu grupo",
        recibidaA: new Date(),
      });
    });
  }, []);

  const activar = async () => {
    setActivando(true);
    setError(null);
    try {
      await activarNotificaciones();
      setEstado("activadas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron activar");
      setEstado(await estadoNotificaciones());
    } finally {
      setActivando(false);
    }
  };

  return (
    <div className="mt-6 border-t border-slate-100 pt-4">
      <h2 className="text-sm font-medium text-slate-700">Notificaciones de emergencia</h2>

      {estado === null && (
        <p className="mt-1 text-sm text-slate-400">Revisando permisos…</p>
      )}

      {estado === "activadas" && (
        <p className="mt-1 text-sm text-emerald-700">
          Activadas en este dispositivo. Recibirás un aviso cuando se presione
          el botón de tu grupo.
        </p>
      )}

      {estado === "desactivadas" && (
        <>
          <p className="mt-1 text-sm text-slate-500">
            Sin esto no te llega aviso cuando alguien presiona el botón.
          </p>
          <button
            onClick={activar}
            disabled={activando}
            className="mt-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {activando ? "Activando…" : "Activar notificaciones"}
          </button>
        </>
      )}

      {estado === "bloqueadas" && (
        <p className="mt-1 text-sm text-amber-700">
          Bloqueaste las notificaciones para este sitio. Habilítalas desde el
          candado junto a la dirección del navegador y recarga la página.
        </p>
      )}

      {estado === "no-soportado" && (
        <p className="mt-1 text-sm text-slate-500">
          Este navegador no soporta notificaciones push. En iPhone hay que
          instalar la app en la pantalla de inicio primero.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {ultimaAlerta && (
        <div className="mt-4 rounded-xl bg-red-600 px-4 py-3 text-white">
          <p className="font-semibold">{ultimaAlerta.titulo}</p>
          <p className="text-sm">{ultimaAlerta.cuerpo}</p>
          <p className="mt-1 text-xs text-red-100">
            {ultimaAlerta.recibidaA.toLocaleTimeString("es-MX")}
          </p>
        </div>
      )}
    </div>
  );
}
