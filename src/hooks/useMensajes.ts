import { useCallback, useEffect, useState } from "react";
import { enviarMensaje, listarMensajes, type Mensaje } from "../services/api";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { useAlReconectar, useEventoTiempoReal } from "../services/tiempoReal";

// Los mensajes llegan al instante por Socket.IO. Esto es solo el respaldo por
// si esa conexión está caída sin que nadie lo note (mismo mecanismo que
// useAlertas.ts): sin él, un evento perdido no se recupera hasta salir del
// chat y volver a entrar.
const REFRESCO_MS = 60_000;

// Junta mensajes sin duplicar (el que yo mando llega dos veces: en la
// respuesta del POST y por el socket) y los deja en orden cronológico.
function combinar(actuales: Mensaje[], nuevos: Mensaje[]) {
  const porId = new Map(actuales.map((m) => [m.id, m]));
  for (const m of nuevos) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Mensajes del chat de un grupo: carga, tiempo real, paginación hacia atrás
// y envío. El scroll lo maneja quien los dibuja.
export function useMensajes(groupId: string) {
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "inicial": solo la primera carga decide si hay mensajes más viejos; al
  // recargar tras una reconexión no se toca (ya pudo haber paginado).
  const cargarRecientes = useCallback(
    async (inicial = false) => {
      try {
        const pagina = await listarMensajes(groupId);
        setMensajes((actuales) => combinar(actuales ?? [], pagina.mensajes));
        if (inicial) setHayMas(pagina.hayMas);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el chat");
      }
    },
    [groupId]
  );

  useEffect(() => {
    setMensajes(null);
    cargarRecientes(true);
  }, [cargarRecientes]);

  useEventoTiempoReal("mensaje:nuevo", (m) => {
    if (m.groupId === groupId) setMensajes((actuales) => combinar(actuales ?? [], [m]));
  });

  // Lo que llegó mientras no había conexión no pasó por el socket.
  useAlReconectar(() => cargarRecientes());

  // Respaldo lento: refresco cada minuto, al volver a la pestaña y al llegar
  // un push en primer plano (por si ese mensaje se le escapó al socket).
  useEffect(() => {
    const intervalo = setInterval(() => cargarRecientes(), REFRESCO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargarRecientes();
    document.addEventListener("visibilitychange", alVolver);
    const dejarDeEscuchar = escucharAlertasEnPrimerPlano((payload) => {
      if (payload.data?.kind === "chat" && payload.data?.groupId === groupId) cargarRecientes();
    });

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      dejarDeEscuchar();
    };
  }, [groupId, cargarRecientes]);

  const cargarAnteriores = async () => {
    if (!mensajes?.length) return;
    setCargandoAnteriores(true);
    try {
      const pagina = await listarMensajes(groupId, mensajes[0].createdAt);
      setMensajes((actuales) => combinar(actuales ?? [], pagina.mensajes));
      setHayMas(pagina.hayMas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los anteriores");
    } finally {
      setCargandoAnteriores(false);
    }
  };

  // Lanza si falla, para que quien llama conserve el texto y deje reintentar.
  const enviar = async (contenido: string) => {
    const mensaje = await enviarMensaje(groupId, contenido);
    setMensajes((actuales) => combinar(actuales ?? [], [mensaje]));
  };

  return { mensajes, hayMas, cargandoAnteriores, cargarAnteriores, enviar, error };
}
