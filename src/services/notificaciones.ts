import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import app from "../firebase/config";
import { borrarTokenPush, registrarTokenPush } from "./api";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export type EstadoNotificaciones =
  | "no-soportado"
  | "desactivadas"
  | "bloqueadas"
  | "activadas";

// El token de FCM pertenece a la suscripción push de UN service worker: el
// único de la app (src/sw/sw.ts, registrado en main.tsx). Tanto al sacar el
// token como al borrarlo hay que pasar ese mismo registro: si getToken se
// llama sin él, Firebase registra otro SW por su cuenta y devuelve un token
// distinto al que tiene el backend.
async function registroDelServiceWorker() {
  const limite = new Promise<never>((_, rechazar) =>
    setTimeout(
      () => rechazar(new Error("El service worker de la app no se activó. Recarga la página.")),
      10_000
    )
  );
  return Promise.race([navigator.serviceWorker.ready, limite]);
}

// Safari en iOS solo permite push si la PWA está instalada en la pantalla de
// inicio, y ningún navegador lo permite sin service workers.
export async function soportaNotificaciones() {
  return (
    typeof Notification !== "undefined" &&
    "serviceWorker" in navigator &&
    (await isSupported())
  );
}

export async function estadoNotificaciones(): Promise<EstadoNotificaciones> {
  if (!(await soportaNotificaciones())) return "no-soportado";
  if (Notification.permission === "denied") return "bloqueadas";
  if (Notification.permission === "granted") return "activadas";
  return "desactivadas";
}

// React en modo estricto monta los componentes dos veces en desarrollo, y dos
// getToken simultáneos pueden devolver tokens distintos, dejando filas
// duplicadas en el backend (una de ellas muerta). Compartir la promesa en
// vuelo evita ese doble registro.
let registroEnCurso: Promise<string> | null = null;

// Pide el permiso, saca el token de FCM de este navegador y lo registra en el
// backend. Devuelve el token para que quien llama pueda desregistrarlo luego.
export function activarNotificaciones(): Promise<string> {
  registroEnCurso ??= registrarEsteNavegador().finally(() => {
    registroEnCurso = null;
  });

  return registroEnCurso;
}

async function registrarEsteNavegador(): Promise<string> {
  if (!(await soportaNotificaciones())) {
    throw new Error("Este navegador no soporta notificaciones push");
  }

  if (!VAPID_KEY) {
    throw new Error(
      "Falta VITE_FIREBASE_VAPID_KEY en el .env (Firebase Console → Cloud Messaging → Certificados push web)"
    );
  }

  if (Notification.permission === "denied") {
    throw new Error(
      "Bloqueaste las notificaciones para este sitio. Habilítalas en la configuración del navegador (candado junto a la dirección) y vuelve a intentar."
    );
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    throw new Error("No se concedió el permiso de notificaciones");
  }

  const registro = await registroDelServiceWorker();

  const token = await getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registro,
  });

  if (!token) {
    throw new Error("Firebase no devolvió un token para este navegador");
  }

  await registrarTokenPush(token);
  return token;
}

// Se llama al cerrar sesión: en un equipo compartido, el siguiente usuario no
// debe recibir las alertas de los grupos del anterior. Es best-effort — si
// falla, no tiene sentido impedirle cerrar sesión.
export async function desactivarNotificaciones() {
  try {
    if (!(await soportaNotificaciones()) || Notification.permission !== "granted") {
      return;
    }

    const mensajeria = getMessaging(app);
    // Ya hay permiso, así que esto no abre ningún diálogo: solo recupera el
    // token vigente para poder decirle al backend cuál borrar.
    const token = await getToken(mensajeria, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await registroDelServiceWorker(),
    });

    if (token) {
      await borrarTokenPush(token);
      await deleteToken(mensajeria);
    }
  } catch (e) {
    console.warn("No se pudo desregistrar el token de notificaciones:", e);
  }
}

// Con la PWA abierta y en primer plano el navegador NO dibuja el aviso del
// sistema: llega por aquí y le toca a la app mostrarlo en pantalla.
//
// onMessage de Firebase guarda UN solo handler (llamarlo otra vez reemplaza
// al anterior), así que se registra una vez y se reparte a todos los que
// escuchan: el aviso en pantalla y las listas de alertas que se refrescan.
type Oyente = (payload: MessagePayload) => void;
const oyentes = new Set<Oyente>();
let escuchando = false;

export function escucharAlertasEnPrimerPlano(alRecibir: Oyente) {
  oyentes.add(alRecibir);

  if (!escuchando) {
    escuchando = true;
    soportaNotificaciones().then((soportado) => {
      if (soportado) {
        onMessage(getMessaging(app), (payload) => oyentes.forEach((o) => o(payload)));
      }
    });
  }

  return () => {
    oyentes.delete(alRecibir);
  };
}
