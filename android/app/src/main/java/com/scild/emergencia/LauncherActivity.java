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

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;



public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }

        pedirPermisoPantallaCompleta();
    }

    @Override
    protected Uri getLaunchingUrl() {
        // Get the original launch Url.
        Uri uri = super.getLaunchingUrl();

        // Le pasa el token nativo de FCM (cacheado por Application/
        // AlertaMessagingService) a la web para que lo registre con el
        // backend si hay sesión iniciada — ver src/main.tsx. Mandarlo en
        // cada arranque es a propósito: registrar el mismo token dos veces
        // no hace daño, y así no hay que coordinar con la web si ya se
        // guardó antes.
        String token = getSharedPreferences(AlertaMessagingService.PREFS, Context.MODE_PRIVATE)
                .getString(AlertaMessagingService.KEY_TOKEN, null);
        if (token != null) {
            uri = uri.buildUpon().appendQueryParameter("tokenNativo", token).build();
        }

        return uri;
    }

    // Android 14+ (API 34) no deja mostrar notificaciones de pantalla
    // completa (la alarma del SOS) sin este permiso aparte, y no se puede
    // conceder a la fuerza: solo se puede pedir que el usuario lo prenda en
    // Ajustes. Se le pregunta una sola vez, al primer arranque donde falte.
    private void pedirPermisoPantallaCompleta() {
        if (Build.VERSION.SDK_INT < 34) return;

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.canUseFullScreenIntent()) return;

        SharedPreferences prefs = getSharedPreferences(AlertaMessagingService.PREFS, Context.MODE_PRIVATE);
        if (prefs.getBoolean("pantalla_completa_pedida", false)) return;
        prefs.edit().putBoolean("pantalla_completa_pedida", true).apply();

        Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
        intent.setData(Uri.parse("package:" + getPackageName()));
        try {
            startActivity(intent);
        } catch (Exception ignorado) {
            // Algunos fabricantes no traen esta pantalla de ajustes; la
            // alerta SOS sigue llegando como notificación normal, solo sin
            // despertar la pantalla sola.
        }
    }
}
