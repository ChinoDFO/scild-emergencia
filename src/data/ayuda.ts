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
    id: "perfil",
    titulo: "Perfil",
    preguntas: [
      {
        id: "apodo",
        pregunta: "¿Cómo cambio mi apodo?",
        respuesta: [
          "En Perfil, toca “Editar” junto a tu nombre. Es el apodo con el que te ven los demás en el chat y en la lista de miembros de tus grupos — no tiene que ser tu nombre real.",
        ],
      },
      {
        id: "tema",
        pregunta: "¿Cómo cambio entre modo claro y oscuro?",
        respuesta: [
          "En Configuración, toca “Modo claro/oscuro”. Se guarda en ese celular o computadora: si usas la app en dos aparatos, puedes tener uno en cada tema.",
        ],
      },
      {
        id: "sirena",
        pregunta: "¿Puedo apagar el sonido de la alerta?",
        respuesta: [
          "En Configuración, “Sirena de emergencia” la apaga en ese aparato. La alerta te sigue llegando igual, como aviso en pantalla y notificación; solo deja de sonar y vibrar como sirena.",
          "Solo el SOS y el botón físico suenan como sirena. Un tipo de alerta como “Carro sospechoso” avisa, pero sin ese ruido.",
        ],
      },
      {
        id: "contrasena",
        pregunta: "Olvidé mi contraseña",
        respuesta: [
          "En la pantalla de inicio de sesión, toca “¿Olvidaste tu contraseña?”, escribe tu correo registrado y te llega un enlace para crear una nueva.",
        ],
      },
      {
        id: "correo",
        pregunta: "¿Cómo cambio mi correo?",
        respuesta: ["En Configuración, “Cambiar correo”."],
      },
      {
        id: "eliminar-cuenta",
        pregunta: "¿Cómo elimino mi cuenta?",
        respuesta: [
          "En Configuración, “Eliminar cuenta”. No se puede deshacer.",
          "Si eres el único administrador de un grupo con más gente adentro, primero nombra a otro administrador. Si tienes botones vinculados y eres el único miembro de ese grupo, elimina el grupo antes de eliminar tu cuenta.",
        ],
      },
    ],
  },
  {
    id: "grupos",
    titulo: "Grupos",
    preguntas: [
      {
        id: "crear-grupo",
        pregunta: "¿Cómo hago un grupo?",
        respuesta: [
          "En la pantalla de Grupos, toca “Crear o unirse a un grupo” (arriba), elige la pestaña “Crear grupo”, y pon el nombre y la dirección del lugar — la dirección es la que usamos para ubicar una emergencia.",
          "Para crear un grupo necesitas tener un botón vinculado a tu cuenta. Si todavía no tienes uno, primero captura su código en Códigos.",
        ],
      },
      {
        id: "unirme-grupo",
        pregunta: "¿Cómo me uno a un grupo que ya existe?",
        respuesta: [
          "Pide el código de invitación a quien administra ese grupo. En Grupos, toca “Crear o unirse a un grupo”, elige la pestaña “Unirme con código” y escríbelo.",
          "No necesitas botón propio para unirte: entras como invitado, viendo el chat y las alertas.",
        ],
      },
      {
        id: "invitar",
        pregunta: "¿Cómo invito a alguien a mi grupo?",
        respuesta: [
          "Abre el grupo, toca su nombre arriba para ver la información, y comparte el código de invitación que aparece ahí. Solo el administrador lo ve.",
          "Si el código se compartió de más, genera uno nuevo desde esa misma pantalla: el anterior deja de funcionar.",
        ],
      },
      {
        id: "cupo-grupo",
        pregunta: "Ya no puedo meter a más gente a mi grupo",
        respuesta: [
          "El cupo es del grupo y lo decide su administrador: desde la información del grupo puede subirlo hasta 50 personas. Si te sale que está lleno, pídeselo a quien lo administra.",
          "Ojo con no confundirlo: el cupo dice cuánta gente cabe en el grupo, no quién puede enviar alertas. Eso lo deciden los titulares de un botón, y son hasta tres por botón.",
        ],
      },
      {
        id: "admin",
        pregunta: "¿Cómo nombro a otro administrador?",
        respuesta: [
          "En la información del grupo, junto al nombre de la persona, toca “Hacer admin”. Puede haber más de uno.",
          "Un grupo nunca se queda sin administrador: si eres el único y quieres salir o dejar el cargo, primero tienes que nombrar a alguien más.",
        ],
      },
      {
        id: "fijar",
        pregunta: "¿Puedo fijar un grupo arriba de la lista?",
        respuesta: [
          "Sí. En la lista de Grupos, toca el icono de chincheta a la derecha de ese grupo; queda arriba de todos los demás. Es solo tuyo: a los demás miembros no les cambia nada.",
        ],
      },
      {
        id: "salir",
        pregunta: "¿Cómo me salgo de un grupo o lo elimino?",
        respuesta: [
          "En la información del grupo, hasta abajo, está “Salir del grupo”. Dejas de recibir sus alertas y de ver su chat.",
          "Si eres el único administrador y quedan más personas, primero nombra administrador a alguien más (ver arriba).",
          "“Eliminar grupo” solo lo puede hacer un administrador, pide escribir el nombre del grupo para confirmar, y borra su chat y su historial de alertas. No se puede deshacer.",
        ],
      },
    ],
  },
  {
    id: "boton",
    titulo: "El botón físico y los códigos",
    preguntas: [
      {
        id: "no-enciende",
        pregunta: "El botón no enciende",
        respuesta: [
          "Desconéctalo 10 segundos y vuelve a conectarlo. Puedes repetirlo hasta 3 veces; si sigue sin prender, escríbenos y te ayudamos directamente.",
        ],
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
        id: "sin-codigo",
        pregunta: "¿Cómo ingreso el código si mi cuenta no tiene uno?",
        respuesta: [
          "Ve a Perfil → Códigos (o a Dispositivos → “Vincular un botón”, te manda al mismo lugar). Escribe el código impreso en la caja del botón, tal como viene (tipo ABC-DEF-GHJ), y toca “Confirmar”.",
          "Si tu código ya se usó, significa que las 3 personas que puede tener ese botón ya están ocupadas por alguien más. En ese caso tu cuenta se queda como invitada: ves el chat y las alertas, pero no puedes dispararlas con el botón ni desde la app.",
        ],
      },
      {
        id: "vincular",
        pregunta: "¿Cómo vinculo mi botón a mi grupo?",
        respuesta: [
          "Son dos pasos, y son cosas distintas. Primero el botón tiene que ser tuyo: captura el código de su caja en Códigos (pregunta de arriba).",
          "Después eliges a qué grupos les avisa: abre tu grupo, toca su nombre arriba para ver la información y, en la sección de Botones, usa “Vincular un botón” y elige uno de los tuyos. Aquí ya no se escribe el código.",
          "Un mismo botón puede avisar hasta a 3 grupos. Si te dice que ya avisa a 3, desvincúlalo de alguno primero desde ahí.",
        ],
      },
      {
        id: "varios-grupos",
        pregunta: "¿Un botón puede avisar a más de un grupo?",
        respuesta: [
          "Sí, hasta a 3. Al presionarlo, la alerta llega a todos esos grupos a la vez: por ejemplo, tu grupo de la tienda y el de la asociación de comerciantes.",
          "Si tú estás en varios de esos grupos recibes un solo aviso, no uno por grupo. La alerta sí aparece en el chat de cada uno.",
          "Ojo: vincular un grupo NO comparte el botón con nadie. Quienes lo comparten son las personas que capturaron el código de su caja (hasta tres), y eso es aparte de los grupos a los que avisa.",
        ],
      },
      {
        id: "quien-puede-alertar",
        pregunta: "¿Quién puede enviar alertas en mi grupo?",
        respuesta: [
          "Solo los titulares de un botón: las personas que capturaron el código impreso en su caja, hasta tres por botón. Suele ser quien compró el aparato y quienes viven o trabajan con esa persona, porque el botón es del lugar.",
          "Los demás miembros del grupo reciben todas las alertas y participan en el chat, pero no pueden dispararlas.",
          "Ese número no se amplía de ninguna manera: el permiso no se presta, no se regala y no se compra. Si en un mismo lugar hacen falta más personas que puedan alertar, la forma es que cada una tenga su propio botón.",
        ],
      },
      {
        id: "red-respaldo",
        pregunta: "¿Cómo configuro una red de wifi de respaldo?",
        respuesta: [
          "Entra a Dispositivos, elige tu botón y toca “Configurar botón”. En la sección “Red de respaldo” captura el nombre y la contraseña de una segunda red, además de la principal.",
          "Si la red principal se cae, el botón intenta solo con la de respaldo — no hace falta ir hasta el aparato.",
        ],
      },
      {
        id: "bateria",
        pregunta: "¿Cuánto dura la batería?",
        respuesta: [
          "Trae una batería integrada de 3000 mAh, con hasta 8 horas continuas de autonomía si se va la luz.",
        ],
      },
    ],
  },
  {
    id: "chats",
    titulo: "Chats",
    preguntas: [
      {
        id: "responder",
        pregunta: "¿Cómo respondo a un mensaje?",
        respuesta: [
          "Debajo de cualquier mensaje hay un icono de flecha; tócalo para responderle. Sale una cita arriba de la caja de texto mostrando a quién le respondes, igual que en WhatsApp — escribe tu mensaje y mándalo normal.",
        ],
      },
      {
        id: "borrar-mensaje",
        pregunta: "¿Puedo borrar un mensaje que mandé?",
        respuesta: [
          "Sí, con el icono de bote de basura debajo de tu mensaje. Si eres administrador del grupo, puedes borrar el de cualquiera, no solo el tuyo.",
          'Queda la fila en su lugar marcada como "Mensaje eliminado" (así las respuestas que lo citaban no se quedan señalando a nada), pero el contenido ya no se puede recuperar.',
        ],
      },
      {
        id: "mensajes-temporales",
        pregunta: "¿Qué son los mensajes temporales?",
        respuesta: [
          "Una opción del administrador para que el chat se borre solo después de cierto tiempo (mínimo 3 días). Se activa desde la información del grupo, en “Mensajes temporales”.",
          "Es opcional: sin activarla, los mensajes se quedan con el borrado general que ya aplica a todos los grupos por antigüedad.",
        ],
      },
      {
        id: "alarmas-favoritas",
        pregunta: "¿Qué son las alarmas favoritas y las personalizadas?",
        respuesta: [
          "Al tocar el “!” junto a la caja de mensaje sale el menú de “¿Qué está pasando?” con los tipos de alerta. En la información del grupo, en “Alarmas del grupo”, el administrador puede elegir hasta 6 favoritas para que salgan primero ahí; el resto se ve scrolleando en ese mismo menú.",
          "En esa misma sección, el administrador también puede crear hasta 3 alarmas propias del grupo (con su nombre y emoji), para algo específico de ese lugar que no esté en el catálogo normal.",
        ],
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
          "En celulares Xiaomi, Huawei, Oppo o Vivo hay un administrador de batería propio, aparte del permiso de notificaciones de Android, que puede cerrar Chrome en segundo plano sin avisar y así cortar las alertas. Busca en Ajustes → Batería → administrador de apps (el nombre cambia según la marca) y pon Chrome como “sin restricciones” o en la lista de apps que pueden iniciarse solas.",
        ],
      },
      {
        id: "sin-boton-sos",
        pregunta: "No me aparece el botón SOS en mi grupo",
        respuesta: [
          "Las alertas las envía quien tiene un botón vinculado a su cuenta. Los demás reciben todas las alertas y participan en el chat, pero no pueden dispararlas.",
          "Si compraste un botón, captura el código de su caja (ver la sección “El botón físico y los códigos” de aquí arriba). Si no tienes botón propio, tu cuenta se queda como invitada.",
        ],
      },
      {
        id: "insistente",
        pregunta: "¿Por qué la alerta suena varias veces?",
        respuesta: [
          "A propósito: una emergencia se repite un par de veces para que no se pierda entre otros avisos. Un mensaje normal del chat suena una sola vez.",
          'Deja de repetirse en cuanto alguien del grupo toca "Ya voy" o marca la alerta como resuelta.',
          "Si tienes la app abierta cuando llega, además suena una sirena en el celular hasta que la silencias (se puede apagar desde Configuración, ver la sección de Perfil).",
        ],
      },
      {
        id: "telefono",
        pregunta: "¿A qué número marco en una emergencia?",
        respuesta: [
          "Cada alerta trae su propio número, justo debajo de la descripción: 911 para casi todo (es el número único de emergencias en México), y 071 (CFE) para fallas eléctricas, además del 911 si hay peligro inmediato.",
          "SCILD avisa a tu grupo, pero no sustituye a los servicios de emergencia oficiales.",
        ],
      },
      {
        id: "que-hacer",
        pregunta: "¿Dónde veo qué hacer en cada tipo de emergencia?",
        respuesta: [
          "Dentro de cada alerta hay un “Qué hacer” que se despliega al tocarlo, con una lista corta de qué sí y qué no hacer para ese tipo de emergencia. Son recomendaciones generales (basadas en Protección Civil y Cruz Roja), no sustituyen el criterio de una autoridad en el momento.",
        ],
      },
      {
        id: "ubicacion-alerta",
        pregunta: "¿Cómo veo la ubicación de una alerta?",
        respuesta: [
          "Si el grupo tiene dirección o coordenadas guardadas, la alerta trae un botón con un pin de ubicación que abre el mapa directo. Sale tanto en la notificación del celular como en la tarjeta de la alerta dentro de la app.",
        ],
      },
      {
        id: "difundir",
        pregunta: "¿Cómo mando una alerta a TODOS mis grupos a la vez?",
        respuesta: [
          "Mantén presionado el botón de emergencia (el círculo del centro, abajo) más de lo normal. Al segundo avisa como siempre a un grupo (o te deja elegir cuál, si estás en varios); si en vez de soltar sigues sosteniendo, el anillo se pone rojo y, al completarlo, la alerta sale para todos tus grupos a la vez.",
          "Es para cuando no hay tiempo de elegir uno. Siempre manda una alerta general (no un tipo específico).",
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
    id: "monitoreo",
    titulo: "Monitoreo de tus botones",
    preguntas: [
      {
        id: "estados",
        pregunta: "¿Qué significa cada estado de mi botón?",
        respuesta: [
          "En línea: se reportó a tiempo, todo normal.",
          "Señal irregular: lleva más de lo esperado sin reportarse, pero no tanto como para decir que está desconectado — vale la pena revisarlo pronto.",
          "Sin conexión: ya pasó bastante tiempo sin reportarse. Casi siempre es falta de corriente o de wifi.",
          "Emergencia: está presionado o sigue sosteniéndose; vuelve a “En línea” solo cuando se resuelve la última alerta abierta.",
          "Mantenimiento: lo marcó así un administrador, por ejemplo mientras se repara o se reubica.",
        ],
      },
      {
        id: "donde-veo",
        pregunta: "¿Dónde veo la batería y la última señal de mi botón?",
        respuesta: [
          "En Dispositivos, toca el botón que quieras ver. Ahí sale su estado, la batería, cuándo se reportó por última vez, y la fuerza de su señal wifi (en dBm, con una palabra que la resume: Excelente, Buena, etc.).",
        ],
      },
      {
        id: "irregular-que-hago",
        pregunta: '¿Qué hago si mi botón dice "Señal irregular"?',
        respuesta: [
          "Revisa que tenga corriente y que el wifi de ese lugar esté funcionando. Casi siempre se corrige solo en el siguiente reporte; si configuraste una red de respaldo, el botón ya intenta cambiarse solo cuando la principal falla.",
          "Si se queda así mucho tiempo, pasa a “Sin conexión” — ver esa pregunta en la sección del botón físico.",
        ],
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
