import { useCallback, useEffect, useState } from "react";
import { cambiarEstadoAlerta, listarAlertas, type Alerta } from "../services/api";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { useAlReconectar, useEventoTiempoReal } from "../services/tiempoReal";

// Los cambios llegan al instante por Socket.IO. Esto es solo el respaldo por
// si la conexión en tiempo real está caída sin que nadie lo note.
const REFRESCO_MS = 60_000;

// Alertas de un grupo (o de todos los del usuario) siempre al día: carga
// inicial, tiempo real, reconexión, al volver a la pestaña, al llegar un push
// en primer plano y un refresco lento de respaldo.
export function useAlertas({ groupId, soloAbiertas }: { groupId?: string; soloAbiertas?: boolean }) {
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setAlertas(await listarAlertas({ groupId, soloAbiertas }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las alertas");
    }
  }, [groupId, soloAbiertas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEventoTiempoReal("alertas:cambio", ({ groupId: grupoDelCambio }) => {
    if (!groupId || groupId === grupoDelCambio) cargar();
  });
  useAlReconectar(cargar);

  useEffect(() => {
    const intervalo = setInterval(cargar, REFRESCO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    const dejarDeEscuchar = escucharAlertasEnPrimerPlano(() => cargar());

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      dejarDeEscuchar();
    };
  }, [cargar]);

  const cambiar = async (alerta: Alerta, accion: "atender" | "resolver") => {
    setCambiando(alerta.id);
    try {
      await cambiarEstadoAlerta(alerta.id, accion);
    } catch (e) {
      // Un 409 significa que alguien más ya la movió: basta con recargar.
      setError(e instanceof Error ? e.message : "No se pudo actualizar la alerta");
    } finally {
      await cargar();
      setCambiando(null);
    }
  };

  return { alertas, error, cargar, cambiar, cambiando };
}
