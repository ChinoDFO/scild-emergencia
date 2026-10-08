package com.scild.emergencia;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

/**
 * Pantalla completa para una alerta GENERAL (SOS o botón físico), disparada
 * desde el {@link AlertaMessagingService} vía setFullScreenIntent. Se
 * comporta como la pantalla de una llamada entrante: despierta el celular y
 * se muestra encima del bloqueo.
 */
public class AlarmaActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }

        setContentView(R.layout.activity_alarma);

        String titulo = getIntent().getStringExtra("titulo");
        String cuerpo = getIntent().getStringExtra("cuerpo");
        String groupId = getIntent().getStringExtra("groupId");
        String alertId = getIntent().getStringExtra("alertId");

        ((TextView) findViewById(R.id.alarmaTitulo)).setText(titulo != null ? titulo : "🚨 Emergencia");
        ((TextView) findViewById(R.id.alarmaCuerpo)).setText(cuerpo != null ? cuerpo : "");

        ((Button) findViewById(R.id.alarmaVerBoton)).setOnClickListener(v -> {
            // Mismo destino que el botón "Ya voy" del push web: abre el grupo con
            // ?atender=<alertId>, que Grupo.tsx resuelve solo al cargar.
            String url = "https://scild-emergencia.vercel.app/grupos/" + groupId
                    + (alertId != null ? "?atender=" + alertId : "");
            Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(abrir);
            finish();
        });

        ((Button) findViewById(R.id.alarmaSilenciarBoton)).setOnClickListener(v -> finish());
    }
}
