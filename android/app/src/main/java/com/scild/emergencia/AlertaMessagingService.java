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

import java.util.Map;

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

    static final String CANAL_SOS = "alertas_sos";
    static final String CANAL_TIPO = "alertas_tipo";
    static final String CANAL_CHAT = "chat";

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
            boolean esGeneral = "GENERAL".equals(datos.get("type")) || "DEVICE".equals(datos.get("source"));
            String alertId = datos.get("alertId");
            if (esGeneral) {
                mostrarSOS(titulo, cuerpo, groupId, alertId);
            } else {
                mostrarAlertaTipo(titulo, cuerpo, groupId, alertId);
            }
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

    private void mostrarSOS(String titulo, String cuerpo, String groupId, String alertId) {
        Intent full = new Intent(this, AlarmaActivity.class);
        full.putExtra("titulo", titulo);
        full.putExtra("cuerpo", cuerpo);
        full.putExtra("groupId", groupId);
        full.putExtra("alertId", alertId);
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
                .setFullScreenIntent(fullScreenPendingIntent, true);

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // Un solo aviso por alerta: el mismo tag reemplaza al anterior (como el
        // renotify del push web) en vez de apilarse.
        nm.notify(alertId != null ? alertId : "sos", 1, builder.build());
    }

    private void mostrarAlertaTipo(String titulo, String cuerpo, String groupId, String alertId) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CANAL_TIPO)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setAutoCancel(true)
                .setContentIntent(intentVerGrupo(groupId, alertId, 2));

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(alertId != null ? alertId : "alerta", 2, builder.build());
    }

    private void mostrarChat(String titulo, String cuerpo, String groupId) {
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CANAL_CHAT)
                .setSmallIcon(R.drawable.ic_notification_icon)
                .setContentTitle(titulo)
                .setContentText(cuerpo)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setAutoCancel(true)
                .setContentIntent(intentVerGrupo(groupId, null, 3));

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        // Se agrupa por grupo (mismo tag): un mensaje nuevo reemplaza al
        // anterior en vez de llenar la pantalla, igual que el push web.
        nm.notify("chat-" + groupId, 3, builder.build());
    }
}
