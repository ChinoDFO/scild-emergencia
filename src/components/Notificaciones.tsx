import { useEffect, useState } from "react";
import {
  activarNotificaciones,
  estadoNotificaciones,
  type EstadoNotificaciones,
} from "../services/notificaciones";

export default function Notificaciones() {
  const [estado, setEstado] = useState<EstadoNotificaciones | null>(null);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--borde-tenue)" }}>
      <h2 className="text-sm font-medium" style={{ color: "var(--texto)" }}>
        Notificaciones de emergencia
      </h2>

      {estado === null && (
        <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
          Revisando permisos…
        </p>
      )}

      {estado === "activadas" && (
        <p className="mt-1 text-sm font-medium" style={{ color: "#16a34a" }}>
          Activadas en este dispositivo. Recibirás un aviso cuando se presione
          el botón de tu grupo.
        </p>
      )}

      {estado === "desactivadas" && (
        <>
          <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
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
        <p className="mt-1 text-sm font-medium" style={{ color: "var(--alerta-texto)", background: "var(--alerta)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
          Bloqueaste las notificaciones para este sitio. Habilítalas desde el
          candado junto a la dirección del navegador y recarga la página.
        </p>
      )}

      {estado === "no-soportado" && (
        <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
          Este navegador no soporta notificaciones push. En iPhone hay que
          instalar la app en la pantalla de inicio primero.
        </p>
      )}

      {error && (
        <p
          className="mt-2 rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--superficie-suave)", color: "var(--peligro)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
