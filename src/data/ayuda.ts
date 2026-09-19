// Contenido del apartado de Ayuda. Está aquí, separado de la pantalla, para
// que agregar o corregir una respuesta sea editar este archivo y ya.
//
// `respuesta` acepta varios párrafos (un elemento del arreglo por párrafo).
// `pendiente: true` marca las que todavía hay que escribir: salen con el
// aviso de "estamos preparando esta información" en vez de dar una respuesta
// a medias.

export interface Pregunta {
  id: string;
  pregunta: string;
  respuesta: string[];
  pendiente?: boolean;
}

export interface SeccionAyuda {
  id: string;
  titulo: string;
  preguntas: Pregunta[];
}

export const SECCIONES_AYUDA: SeccionAyuda[] = [
  {
    id: "boton",
    titulo: "El botón físico",
    preguntas: [
      {
        id: "no-enciende",
        pregunta: "El botón no enciende",
        respuesta: [],
        pendiente: true,
      },
      {
        id: "sin-conexion",
        pregunta: 'La app dice que mi botón está "sin conexión"',
        respuesta: [
          "La app marca un botón como sin conexión cuando lleva un rato sin reportarse. Casi siempre es falta de corriente o de wifi.",
          "Revisa que esté conectado y que la red de tu establecimiento esté funcionando. En cuanto se reporta de nuevo, el estado se corrige solo en la app.",
        ],
      },
      {
        id: "vincular",
        pregunta: "¿Cómo vinculo mi botón a mi grupo?",
        respuesta: [
          "En la caja del botón viene un código de vinculación, tipo ABC-DEF-GHJ.",
          "Abre tu grupo, toca su nombre arriba para ver la información y, en la sección de Botones, usa “Vincular un botón”. Captura el código y ponle un nombre para reconocerlo.",
          "Si te dice que ese botón ya está vinculado, es que sigue ligado a otro grupo: desvincúlalo primero desde ahí.",
        ],
      },
      {
        id: "instalar",
        pregunta: "¿Cómo instalo o cambio de lugar el botón?",
        respuesta: [],
        pendiente: true,
      },
      {
        id: "bateria",
        pregunta: "¿Cuánto dura la batería y cómo se cambia?",
        respuesta: [],
        pendiente: true,
      },
    ],
  },
  {
    id: "alertas",
    titulo: "Alertas y notificaciones",
    preguntas: [
      {
        id: "no-llegan",
        pregunta: "No me llegan las notificaciones",
        respuesta: [
          "Primero, en la pantalla de inicio de la app debe decir que las notificaciones están activadas. Si aparece el botón para activarlas, tócalo y acepta el permiso.",
          "Si las bloqueaste por error, en el celular entra a los ajustes del navegador o de la app instalada y vuelve a permitir las notificaciones.",
          "En iPhone solo funcionan si instalaste la app en la pantalla de inicio.",
          "En Windows revisa que el sistema tenga permitidas las notificaciones y que no esté activado el modo “No molestar”.",
        ],
      },
      {
        id: "probar",
        pregunta: "¿Puedo hacer una prueba sin que sea una emergencia real?",
        respuesta: [
          "Sí, pero avisa antes a tu grupo: la alerta le llega a todos.",
          "Manda una alerta desde la app y márcala como resuelta en cuanto confirmes que a todos les llegó.",
        ],
      },
      {
        id: "falsa",
        pregunta: "Mandé una alerta por error",
        respuesta: [
          "No se puede borrar, y es a propósito: queda el registro de lo que pasó.",
          'Márcala como "Resuelta" y avisa por el chat del grupo que fue una falsa alarma, para que nadie salga por nada.',
        ],
      },
    ],
  },
  {
    id: "cuenta",
    titulo: "Cuenta y grupos",
    preguntas: [
      {
        id: "invitar",
        pregunta: "¿Cómo invito a alguien a mi grupo?",
        respuesta: [
          "Abre el grupo, toca su nombre arriba para ver la información, y comparte el código de invitación. Solo el administrador lo ve.",
          "Esa persona debe crear su cuenta y usar la opción “Unirme con código”.",
          "Si el código se compartió de más, genera uno nuevo desde esa misma pantalla: el anterior deja de funcionar.",
        ],
      },
      {
        id: "salir",
        pregunta: "¿Cómo me salgo de un grupo o lo elimino?",
        respuesta: [
          "En la información del grupo, hasta abajo, está “Salir del grupo”. Dejas de recibir sus alertas.",
          "Si eres el único administrador y quedan más personas, primero nombra administrador a alguien más.",
          "Eliminar el grupo solo lo puede hacer un administrador y borra su chat y su historial de alertas. No se puede deshacer.",
        ],
      },
      {
        id: "contrasena",
        pregunta: "Olvidé mi contraseña",
        respuesta: [],
        pendiente: true,
      },
    ],
  },
];

// Se llena cuando definan el canal de soporte real.
export const CONTACTO = {
  telefono: "",
  correo: "",
  horario: "",
};
