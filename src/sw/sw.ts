// Service worker ÚNICO de la PWA. Solo puede haber un service worker por
// scope, así que este archivo hace las dos cosas a la vez:
//   1. Instalación/offline: precachea la app (lista que inyecta
//      vite-plugin-pwa en self.__WB_MANIFEST al compilar).
//   2. Push: recibe las alertas de FCM con la app cerrada.
//
// Reemplaza al antiguo public/firebase-messaging-sw.js. Como este sí pasa por
// Vite, lee la config de Firebase de import.meta.env igual que el resto de la
// app, en vez de recibirla en la query string.

import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

declare let self: ServiceWorkerGlobalScope;

// --- 1. Instalación y funcionamiento sin red --------------------------------

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Es una SPA: /grupos/123 no existe como archivo, así que cualquier
// navegación se responde con index.html (y React Router hace el resto). Así
// la app abre aunque el celular esté sin datos en ese momento.
registerRoute(new NavigationRoute(createHandlerBoundToURL("index.html")));

// Una versión nueva entra en cuanto se descarga, sin esperar a que se cierren
// todas las pestañas: en una app de emergencias no conviene que alguien se
// quede días con una versión vieja.
self.skipWaiting();
clientsClaim();

// --- 2. Alertas push --------------------------------------------------------

// Al tocar el aviso: si la PWA ya está abierta (en la pantalla que sea), se
// enfoca esa ventana; si no, se abre la app. Tiene que registrarse ANTES que
// Firebase: el handler del SDK llama a stopImmediatePropagation() y solo
// enfoca una ventana si su URL coincide exacto con el link, así que si
// corriera primero este nunca se ejecutaría (le pasaba al SW anterior).
self.addEventListener("notificationclick", (evento) => {
  const mensaje = evento.notification.data?.FCM_MSG;
  if (!mensaje) return;

  evento.stopImmediatePropagation();
  evento.notification.close();

  // Lo que el backend mandó en "data": de qué grupo y qué alerta es.
  const datos: Record<string, string> = mensaje.data ?? {};

  // A dónde llevar a la persona. Con el grupo se abre su pantalla directo;
  // el botón "Ya voy" agrega ?atender=<alerta> y de eso se encarga la app al
  // cargar (el service worker no puede llamar a la API: no tiene sesión).
  let destino = self.registration.scope;
  if (datos.groupId) {
    destino += `grupos/${datos.groupId}`;
    if (evento.action === "atender" && datos.alertId) {
      destino += `?atender=${datos.alertId}`;
    }
  }

  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
      if (abierta) {
        // navigate puede fallar (la pestaña está en otro origen, el
        // navegador no lo permite); enfocarla siempre es mejor que nada.
        try {
          await abierta.navigate(destino);
        } catch {
          // Se queda donde estaba.
        }
        await abierta.focus();
        return;
      }
      await self.clients.openWindow(destino);
    })()
  );
});

// Basta con inicializar: como el backend manda el bloque "notification", el
// SDK muestra el aviso solo. No agregar onBackgroundMessage con otro
// showNotification o el aviso sale DUPLICADO.
getMessaging(
  initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })
);
