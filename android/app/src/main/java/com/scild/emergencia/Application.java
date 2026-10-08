/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.scild.emergencia;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessaging;

public class Application extends android.app.Application {

  @Override
  public void onCreate() {
      super.onCreate();
      crearCanalesDeNotificacion();
      pedirTokenNativo();
  }

  // Tres canales, para que el usuario pueda ajustar el volumen/vibración de
  // cada uno por separado desde Ajustes de Android — y porque una vez creado
  // un canal, Android ignora lo que mande cualquier notificación individual
  // (sonido, importancia): el canal manda. Ver AlertaMessagingService.
  private void crearCanalesDeNotificacion() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return;

    AudioAttributes atributosAlarma = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build();
    Uri sonidoAlarma = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM);

    NotificationChannel sos = new NotificationChannel(
        AlertaMessagingService.CANAL_SOS, "Alertas de emergencia (SOS)", NotificationManager.IMPORTANCE_HIGH);
    sos.setDescription("El botón de pánico o el SOS de la app. Suena fuerte y despierta la pantalla a propósito.");
    sos.enableVibration(true);
    sos.setVibrationPattern(new long[]{0, 500, 250, 500, 250, 500});
    if (sonidoAlarma != null) sos.setSound(sonidoAlarma, atributosAlarma);
    sos.setBypassDnd(true);
    sos.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
    nm.createNotificationChannel(sos);

    NotificationChannel tipo = new NotificationChannel(
        AlertaMessagingService.CANAL_TIPO, "Alertas por tipo", NotificationManager.IMPORTANCE_DEFAULT);
    tipo.setDescription("Carro sospechoso, incendio, etc. — se avisan, pero sin el ruido del SOS.");
    tipo.enableVibration(true);
    nm.createNotificationChannel(tipo);

    NotificationChannel chat = new NotificationChannel(
        AlertaMessagingService.CANAL_CHAT, "Mensajes del chat", NotificationManager.IMPORTANCE_LOW);
    chat.setDescription("Mensajes nuevos del chat de tus grupos.");
    nm.createNotificationChannel(chat);
  }

  // Se guarda en SharedPreferences (ver AlertaMessagingService.onNewToken);
  // LauncherActivity lo manda al backend la próxima vez que se abra la app.
  // No hace falta esperar aquí: con que quede cacheado para el próximo
  // arranque es suficiente, y repetir el registro no hace daño.
  private void pedirTokenNativo() {
    FirebaseMessaging.getInstance().getToken().addOnCompleteListener(tarea -> {
      if (!tarea.isSuccessful()) return;
      getSharedPreferences(AlertaMessagingService.PREFS, Context.MODE_PRIVATE)
          .edit()
          .putString(AlertaMessagingService.KEY_TOKEN, tarea.getResult())
          .apply();
    });
  }
}
