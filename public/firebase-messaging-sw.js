// Service worker de Firebase Cloud Messaging: es quien recibe las alertas
// cuando la PWA está en segundo plano o cerrada. Sin este archivo el push web
// no funciona, por diseño del navegador.
//
// Este archivo NO pasa por Vite (vive en public/ y se sirve tal cual), así que
// no puede leer import.meta.env ni importar del bundle. Por eso usa el SDK
// "compat" desde el CDN y recibe la config del proyecto en la query string con
// la que lo registra src/services/notificaciones.ts. Ventaja adicional: no
// queda un firebaseConfig hardcodeado y versionado en el repo.

importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

const parametros = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: parametros.get("apiKey"),
  authDomain: parametros.get("authDomain"),
  projectId: parametros.get("projectId"),
  messagingSenderId: parametros.get("messagingSenderId"),
  appId: parametros.get("appId"),
});

// Basta con inicializar la mensajería: como el backend manda el bloque
// "notification", el navegador muestra el aviso solo. Si aquí se agregara un
// onBackgroundMessage que también llame a showNotification, en Chrome saldría
// la notificación DUPLICADA.
firebase.messaging();

// Al tocar el aviso: si la PWA ya está abierta en alguna pestaña, se enfoca
// esa en vez de abrir una nueva.
self.addEventListener("notificationclick", (evento) => {
  const destino = evento.notification?.data?.FCM_MSG?.notification?.click_action;
  evento.notification.close();

  evento.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
      if (abierta) {
        await abierta.focus();
        return;
      }

      await self.clients.openWindow(destino || self.registration.scope);
    })()
  );
});
