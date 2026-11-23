package com.scild.emergencia;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

/**
 * Pantalla completa para cualquier alerta (SOS, botón físico, o un tipo como
 * "Carro sospechoso"), disparada desde el {@link AlertaMessagingService} vía
 * setFullScreenIntent. Se comporta como la pantalla de una llamada entrante:
 * despierta el celular y se muestra encima del bloqueo.
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
        String mapUrl = getIntent().getStringExtra("mapUrl");

        ((TextView) findViewById(R.id.alarmaTitulo)).setText(titulo != null ? titulo : "🚨 Emergencia");
        ((TextView) findViewById(R.id.alarmaCuerpo)).setText(cuerpo != null ? cuerpo : "");

        Button verUbicacionBoton = findViewById(R.id.alarmaVerUbicacionBoton);
        if (mapUrl != null && !mapUrl.isEmpty()) {
            verUbicacionBoton.setVisibility(View.VISIBLE);
            verUbicacionBoton.setOnClickListener(v -> {
                Intent abrirMapa = new Intent(Intent.ACTION_VIEW, Uri.parse(mapUrl));
                abrirMapa.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(abrirMapa);
            });
        }

        ((Button) findViewById(R.id.alarmaVerBoton)).setOnClickListener(v -> {
            // Mismo destino que el botón "Enterado" del push web: abre el grupo con
            // ?atender=<alertId>, que Grupo.tsx resuelve solo al cargar.
            String url = "https://scild-emergencia.vercel.app/grupos/" + groupId
                    + (alertId != null ? "?atender=" + alertId : "");
            Intent abrir = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            abrir.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(abrir);
            finish();
        });

        ((Button) findViewById(R.id.alarmaSilenciarBoton)).setOnClickListener(v -> {
            // A diferencia de "Enterado", esto NO le avisa al servidor —
            // alguien puede querer callarla sin comprometerse a ir. Por eso
            // el servidor va a seguir insistiendo hasta 3 veces en total;
            // lo único que se puede hacer aquí es que esas repeticiones ya
            // no vuelvan a sonar fuerte ni a abrir esta pantalla EN ESTE
            // celular (ver AlertaMessagingService.marcarSilenciada).
            AlertaMessagingService.marcarSilenciada(this, alertId);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            nm.cancel(alertId != null ? alertId : "alerta", 1);
            finish();
        });
    }
}
