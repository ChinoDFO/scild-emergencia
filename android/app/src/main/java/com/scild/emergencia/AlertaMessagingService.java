package com.scild.emergencia;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Collections;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Recibe el push de FCM DIRECTO, sin pasar por la delegación de Chrome
 * (TrustedWebActivityService) — por eso puede usar su propio canal de
 * Android con sonido de alarma y pantalla completa, cosa que la delegación
 * web nunca puede dar (todas las notificaciones de un mismo sitio caen en
 * UN SOLO canal compartido, sin importar lo que se mande desde el push
 * web). Es un segundo camino, aparte del push web normal, que sigue
 * funcionando igual para quien use la PWA sin instalar esta app — ver
 * services/notificaciones.ts, que deja de pedir el token web cuando detecta
 * que corre dentro de esta app (document.referrer empieza con
 * "android-app://").
 *
 * El backend manda SOLO "data" a los tokens de este tipo (nunca
 * "notification"): así Android entrega el mensaje aquí siempre, en vez de
 * dibujarlo solo si la app está en primer plano. Ver mensajeAndroidNativo
 * en scild-backend/src/push.js.
 */
public class AlertaMessagingService extends FirebaseMessagingService {

    public static final String PREFS = "scild_push";
    public static final String KEY_TOKEN = "fcm_token_nativo";

    // v2: Android no deja cambiar el sonido/vibración de un canal ya creado
    // en el celular de alguien, así que cuando cambia el sonido del SOS hay
    // que correr el id — si no, quien ya lo tenía instalado se queda con el
    // sonido viejo para siempre, sin importar qué diga el código.
    static final String CANAL_SOS = "alertas_sos_v2";
    // v2: iba en IMPORTANCE_LOW (nunca sonaba, solo aparecía en la barra) y
    // ahora va en DEFAULT para que de verdad llegue pronto — mismo problema
    // que ya resolvimos con el SOS, así que el id también tiene que cambiar
    // para que un celular que ya tenía el canal viejo adopte el nuevo.
    static final String CANAL_CHAT = "chat_v2";

    // El servidor insiste con la misma alerta hasta 3 veces (cada 4s) si
    // nadie la atiende — se corta solo cuando alguien toca "Enterado" en
    // cualquier dispositivo, porque eso sí le avisa al servidor. "Silenciar"
    // (ver AlarmaActivity) es local: no le avisa a nadie más, así que lo
    // único que puede hacer es apuntar aquí qué alertId ya no debe volver a
    // sonar fuerte EN ESTE celular, aunque el servidor siga insistiendo.
    private static final String KEY_SILENCIADAS = "alertas_silenciadas";

    static boolean estaSilenciada(Context ctx, String alertId) {
        if (alertId == null) return false;
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getStringSet(KEY_SILENCIADAS, Collections.emptySet())
                .contains(alertId);
    }

    static void marcarSilenciada(Context ctx, String alertId) {
        if (alertId == null) return;
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Set<String> actuales = new HashSet<>(prefs.getStringSet(KEY_SILENCIADAS, Collections.emptySet()));
        actuales.add(alertId);
        prefs.edit().putStringSet(KEY_SILENCIADAS, actuales).apply();
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        // Se manda al backend cuando se abra la app (ver LauncherActivity):
        // de aquí no se puede, este servicio no sabe si hay sesión iniciada.
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_TOKEN, token)
                .apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);

        Map<String, String> datos = message.getData();
        if (datos.isEmpty()) return;

        String kind = datos.get("kind");
        String titulo = datos.getOrDefault("titulo", "SCILD");
        String cuerpo = datos.getOrDefault("cuerpo", "");
        String groupId = datos.get("groupId");

        if ("chat".equals(kind)) {
            mostrarChat(titulo, cuerpo, groupId);
            return;
        }

        if ("alerta".equals(kind)) {
            // Toda alerta (SOS, botón físico, o un tipo como "Carro
            // sospechoso") despierta la pantalla igual: en un coto o un
            // negocio cualquier aviso es algo que alguien tiene que ver
            // ahora, no solo el SOS general.
            mostrarAlerta(titulo, cuerpo, groupId, datos.get("alertId"), datos.get("mapUrl"));
        }
    }

    private PendingIntent intentVerGrupo(String groupId, String alertId, int requestCode) {
        String url = "https://scild-emergencia.vercel.app/grupos/" + groupId
                + (alertId != null ? "?atender=" + alertId : "");
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getActivity(this, requestCode, intent, flags);
    }

    private void mostrarAlerta(String titulo, String cuerpo, String groupId, String alertId, String mapUrl) {
        // "Silenciar" en AlarmaActivity marcó este alertId: el servidor va a
        // seguir insistiendo (hasta 3 veces en total), pero en este celular
        // ya no debe volver a sonar fuerte ni abrir la pantalla completa.
        if (estaSilenciada(this, alertId)) return;

        Intent full = new Intent(this, AlarmaActivity.class);
        full.putExtra("titulo", titulo);
        full.putExtra("cuerpo", cuerpo);
        full.putExtra("groupId", groupId);
        full.putExtra("alertId", alertId);
        full.putExtra("mapUrl", mapUrl);
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent fullScreenPendingIntent =
                PendingIntent.getActivity(this, 0, full, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CANAL_SOS)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(intentVerGrupo(groupId, alertId, 1))
                .setFullScreenIntent(fullScreenPendingIntent, true)
                // Mismo par de acciones que el push web (mensajeDeAlerta en
                // push.js): "Enterado" marca la alerta como atendida en el
                // servidor (por eso usa el mismo intent que tocar el aviso),
                // y "Ver ubicación" solo aparece si el grupo tiene dónde
                // mandar.
                .addAction(0, "Enterado", intentVerGrupo(groupId, alertId, 1));

        if (mapUrl != null && !mapUrl.isEmpty()) {
            builder.addAction(0, "Ver ubicación", intentVerUbicacion(mapUrl, 4));
        }

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // Un solo aviso por alerta: el mismo tag reemplaza al anterior (como el
        // renotify del push web) en vez de apilarse.
        nm.notify(alertId != null ? alertId : "alerta", 1, builder.build());
    }

    private PendingIntent intentVerUbicacion(String mapUrl, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(mapUrl));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getActivity(this, requestCode, intent, flags);
    }

    private void mostrarChat(String titulo, String cuerpo, String groupId) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CANAL_CHAT)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(intentVerGrupo(groupId, null, 3));

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // Se agrupa por grupo (mismo tag): un mensaje nuevo reemplaza al
        // anterior en vez de llenar la pantalla, igual que el push web.
        nm.notify("chat-" + groupId, 3, builder.build());
    }
}
