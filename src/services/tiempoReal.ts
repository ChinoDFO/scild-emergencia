import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { auth } from "../firebase/config";
import type { Mensaje } from "./api";

// Conexión en tiempo real con el backend (Socket.IO). Solo RECIBE avisos:
// mensajes nuevos del chat y cambios en alertas o en el grupo. Todo lo que la
// app hace (mandar mensajes, alertas...) sigue yendo por la API HTTP.
//
// Una sola conexión para toda la app, que se abre la primera vez que alguna
// pantalla escucha un evento y se cierra al cerrar sesión.

export interface EventosTiempoReal {
  "mensaje:nuevo": Mensaje;
  "alertas:cambio": { groupId: string; alertId: string };
  "grupo:actualizado": { groupId: string };
  "grupo:eliminado": { groupId: string };
}

let socket: Socket | null = null;

function obtenerSocket(): Socket {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_API_URL, {
    // Función y no valor fijo: en cada (re)conexión se manda un ID token
    // fresco, porque caducan a la hora y la conexión puede durar más.
    auth: (enviar) => {
      const usuario = auth.currentUser;
      if (!usuario) return enviar({});
      usuario.getIdToken().then((token) => enviar({ token }), () => enviar({}));
    },
  });

  const reintentar = () => setTimeout(() => socket?.connect(), 5_000);

  // Socket.IO NO se reconecta solo en dos casos: si el servidor cortó la
  // conexión a propósito, o si la rechazó al conectar (token vencido, base
  // caída). Aquí se reintenta en ambos para no quedarse sordo sin avisar.
  socket.on("disconnect", (motivo) => {
    if (motivo === "io server disconnect") reintentar();
  });
  socket.on("connect_error", () => {
    if (!socket?.active) reintentar();
  });

  return socket;
}

// El servidor mete al socket en las salas de los grupos que el usuario tenía
// al conectarse. Si entró a un grupo después, hay que pedirlo (y volver a
// pedirlo en cada reconexión, porque las salas se pierden al desconectarse).
export function entrarASalaDeGrupo(groupId: string) {
  const s = obtenerSocket();
  const entrar = () => s.emit("grupo:entrar", groupId);
  if (s.connected) entrar();
  s.on("connect", entrar);
  return () => {
    s.off("connect", entrar);
  };
}

// Le avisa al backend qué grupo trae abierto en pantalla, para que no le
// mande push de los mensajes que ya está viendo. Se limpia al salir.
export function avisarGrupoAbierto(groupId: string | null) {
  const s = obtenerSocket();
  const avisar = () => s.emit("grupo:viendo", groupId);
  if (s.connected) avisar();
  s.on("connect", avisar);
  return () => {
    s.off("connect", avisar);
    if (s.connected) s.emit("grupo:viendo", null);
  };
}

// Se llama al cerrar sesión: la conexión va autenticada como el usuario
// anterior y no debe seguir recibiendo sus mensajes.
export function desconectarTiempoReal() {
  socket?.disconnect();
  socket = null;
}

// Escucha un evento mientras el componente esté montado. El handler puede
// cambiar entre renders sin volver a suscribirse.
export function useEventoTiempoReal<E extends keyof EventosTiempoReal>(
  evento: E,
  alRecibir: (datos: EventosTiempoReal[E]) => void
) {
  const handler = useRef(alRecibir);
  useEffect(() => {
    handler.current = alRecibir;
  });

  useEffect(() => {
    const s = obtenerSocket();
    const escuchar = (datos: EventosTiempoReal[E]) => handler.current(datos);
    s.on(evento, escuchar as never);
    return () => {
      s.off(evento, escuchar as never);
    };
  }, [evento]);
}

// Cuando se recupera la conexión pudo perderse algo en el inter: quien
// escucha esto vuelve a pedir sus datos. No se dispara en la primera conexión.
export function useAlReconectar(alReconectar: () => void) {
  const handler = useRef(alReconectar);
  useEffect(() => {
    handler.current = alReconectar;
  });

  useEffect(() => {
    const s = obtenerSocket();
    let primera = !s.connected;
    const alConectar = () => {
      if (primera) {
        primera = false;
        return;
      }
      handler.current();
    };
    s.on("connect", alConectar);
    return () => {
      s.off("connect", alConectar);
    };
  }, []);
}

// ¿Hay conexión en tiempo real con el backend? Para mostrar "Conectando…"
// (como en las apps de mensajería) en vez de fallar en silencio cuando el
// servidor está caído. Espera un momento antes de avisar para no parpadear
// en cada carga normal de la página.
export function useConexionTiempoReal(esperaMs = 2_000) {
  const [conectado, setConectado] = useState(true);

  useEffect(() => {
    const s = obtenerSocket();
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const alConectar = () => {
      clearTimeout(temporizador);
      setConectado(true);
    };
    const alPerder = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => setConectado(s.connected), esperaMs);
    };

    if (!s.connected) alPerder();
    s.on("connect", alConectar);
    s.on("disconnect", alPerder);
    s.on("connect_error", alPerder);
    return () => {
      clearTimeout(temporizador);
      s.off("connect", alConectar);
      s.off("disconnect", alPerder);
      s.off("connect_error", alPerder);
    };
  }, [esperaMs]);

  return conectado;
}
