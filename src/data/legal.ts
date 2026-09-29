// Contenido de Términos y Condiciones / Aviso de Privacidad. Igual que
// src/data/ayuda.ts: vive aparte para poder corregirlo sin tocar las
// pantallas que lo muestran (la de aceptación y la de Configuración).
//
// OJO antes de publicar: RESPONSABLE/CONTACTO son provisionales (el dominio
// que ya usa la app en Configuración). No sustituye revisión legal: en
// particular la sección "Límite de responsabilidad" de los Términos y toda
// la sección de datos personales del Aviso de Privacidad, por tratarse de un
// producto de seguridad física con datos sensibles (dirección, telemetría).

export const RESPONSABLE = "SCILD";
export const CONTACTO_LEGAL = "hola@scild.mx";
export const CONTACTO_PRIVACIDAD = "privacidad@scild.mx";

// Cambiar esta fecha cada vez que el contenido de abajo cambie de forma
// relevante: es lo que en el futuro permitiría pedir una nueva aceptación
// (hoy el backend solo guarda LA fecha en que se aceptó, no la versión).
export const VERSION_TERMINOS = "2026-09-29";

export interface SeccionLegal {
  id: string;
  titulo: string;
  parrafos: string[];
}

export const TERMINOS: SeccionLegal[] = [
  {
    id: "que-es",
    titulo: "Qué es SCILD",
    parrafos: [
      "SCILD conecta un botón físico de emergencia con tu grupo o establecimiento: al presionarlo (o al enviar una alerta manual desde la app), tu grupo recibe un aviso, puede ver el estado del botón y chatear entre sus integrantes.",
      "Arquitectura: el botón nunca habla directo contigo, todo pasa por nuestros servidores.",
    ],
  },
  {
    id: "elegibilidad",
    titulo: "Quién puede usar la app",
    parrafos: [
      "Necesitas al menos 18 años para registrar una cuenta. Un adulto responsable puede agregar a un menor como integrante de su grupo, bajo su supervisión.",
      "La información que nos das al registrarte (correo, apodo) debe ser veraz y actualizada.",
    ],
  },
  {
    id: "cuentas",
    titulo: "Cuentas completas e invitadas",
    parrafos: [
      "Una cuenta invitada participa en el chat y ve las alertas de su grupo, pero no puede disparar alertas. Se vuelve completa únicamente capturando el código impreso en la caja de un botón adquirido legítimamente: no se otorga, transfiere ni vende de otra forma.",
      "Eres responsable de resguardar ese código y tu contraseña. Si se filtran a alguien ajeno, esa persona podría volverse titular o entrar a tu cuenta; avísanos de inmediato si sospechas de esto.",
    ],
  },
  {
    id: "responsabilidad",
    titulo: "Límite de responsabilidad — importante",
    parrafos: [
      "SCILD NO sustituye a los servicios de emergencia oficiales. Ante una emergencia real, contacta primero al 911 (o el equivalente en tu país); SCILD es un complemento para avisar a tu grupo, no un canal directo con autoridades.",
      "El servicio depende de factores fuera de nuestro control total: conexión a internet del botón y de tu router, suministro eléctrico, disponibilidad de los proveedores de notificaciones push y de nuestros servidores, y que tu navegador tenga los permisos necesarios. No garantizamos que una alerta llegue de forma instantánea, ni que llegue en todos los casos.",
      "En la máxima medida que permita la ley, SCILD no es responsable por daños derivados de fallas de conectividad, demoras, fallas del dispositivo o del backend, o decisiones tomadas con base en lo que muestra la app. Esto no aplica cuando la ley no permita limitar esa responsabilidad, ni limita derechos irrenunciables del consumidor.",
      "El servicio se ofrece \"tal cual\" y en mejora continua; puede haber mantenimientos o interrupciones temporales.",
    ],
  },
  {
    id: "uso-aceptable",
    titulo: "Uso aceptable",
    parrafos: [
      "No generes alertas falsas o de broma: puede tener consecuencias legales además de la suspensión de tu cuenta.",
      "No uses el chat para acosar, amenazar o compartir contenido ilegal o que viole derechos de terceros.",
      "No intentes vulnerar los sistemas del backend, ni acceder a cuentas o botones que no te pertenecen.",
      "No compartas tu cuenta, contraseña o el código de la caja con personas ajenas a tu grupo o establecimiento.",
    ],
  },
  {
    id: "contenido",
    titulo: "Tu contenido",
    parrafos: [
      "Eres el único responsable de lo que envías en el chat de tu grupo. Lo almacenamos y mostramos únicamente a los integrantes de ese grupo, para operar el servicio; no lo usamos con fines publicitarios.",
      "Evita compartir en el chat información sensible que no sea necesaria (contraseñas, datos bancarios, información médica de terceros).",
    ],
  },
  {
    id: "dispositivo",
    titulo: "El botón físico",
    parrafos: [
      "El identificador secreto del botón se entrega una sola vez al darlo de alta y no se puede recuperar después; si se pierde, hay que dar de baja el botón y sustituirlo.",
      "Eres responsable de la instalación, alimentación eléctrica y conexión a internet del botón en tu domicilio o establecimiento.",
    ],
  },
  {
    id: "cuenta-cierre",
    titulo: "Suspensión, cancelación y cambios",
    parrafos: [
      "Podemos suspender o cancelar tu acceso si incumples estos Términos, generas riesgo para otros usuarios, o por requerimiento legal. Puedes eliminar tu cuenta cuando quieras desde Configuración.",
      "Podemos actualizar estos Términos; si el cambio es importante te avisaremos dentro de la app o por correo antes de que entre en vigor. Seguir usando SCILD después de esa fecha implica que los aceptas.",
    ],
  },
];

export const PRIVACIDAD: SeccionLegal[] = [
  {
    id: "responsable",
    titulo: "Responsable de tus datos",
    parrafos: [
      `${RESPONSABLE} es responsable del tratamiento de tus datos personales en relación con esta app, el backend que la sostiene y el botón físico asociado. Puedes escribirnos sobre temas de privacidad a ${CONTACTO_PRIVACIDAD}.`,
    ],
  },
  {
    id: "datos",
    titulo: "Qué datos recabamos",
    parrafos: [
      "Datos de cuenta (correo; la contraseña la gestiona Firebase Authentication y nunca la vemos nosotros), tu apodo, el nombre y dirección del grupo/establecimiento (la dirección es necesaria para saber a dónde dirigirse en una emergencia), y el contenido que envías en el chat.",
      "Configuración y telemetría del botón: nombre del aparato, intervalos de aviso, y si está conectado, señal WiFi, fallas de conexión, nivel de batería y versión de firmware. Si configuras una red WiFi de respaldo para el botón, esa contraseña se transmite al aparato para que pueda conectarse: usa una red dedicada si te preocupa compartirla.",
      "Datos de alertas (tipo, quién la generó, cuándo se atendió/resolvió), el token de notificaciones push de tu navegador, y registros técnicos básicos para seguridad y diagnóstico.",
      "No pedimos datos financieros dentro de la app, ni datos sensibles (salud, creencias, etc.); evita incluirlos voluntariamente en el chat salvo que sea estrictamente necesario.",
    ],
  },
  {
    id: "finalidades",
    titulo: "Para qué los usamos",
    parrafos: [
      "Crear y operar tu cuenta y tus grupos, recibir y notificar alertas, mostrarte el estado de tu botón, aplicar la configuración que le definas, dar soporte, prevenir fraude/abuso y cumplir obligaciones legales.",
      "De forma opcional (puedes oponerte sin que afecte tu acceso al servicio): enviarte novedades sobre mejoras al servicio o encuestas.",
    ],
  },
  {
    id: "transferencias",
    titulo: "Con quién los compartimos",
    parrafos: [
      "Con proveedores que operan como encargados del tratamiento: Google Firebase (inicio de sesión y notificaciones push), Neon (base de datos) y el proveedor de hosting del backend. No vendemos ni rentamos tus datos con fines publicitarios.",
      "Solo compartimos datos adicionales cuando lo exige la ley, para proteger derechos/seguridad de SCILD o de nuestros usuarios, o con tu consentimiento expreso.",
    ],
  },
  {
    id: "seguridad",
    titulo: "Cómo los protegemos",
    parrafos: [
      "Tu contraseña la gestiona Firebase, nunca nosotros. El identificador secreto del botón se guarda siempre cifrado (hash), nunca en texto plano. El acceso al chat, alertas y botones de un grupo está restringido a sus propios integrantes.",
      "Ningún sistema es infalible: si detectamos una vulneración que afecte tus datos, te lo notificaremos conforme lo exija la ley.",
    ],
  },
  {
    id: "derechos",
    titulo: "Tus derechos (acceso, rectificación, cancelación, oposición)",
    parrafos: [
      "Puedes acceder, corregir (tu apodo y, si eres administrador, la dirección del grupo, los editas tú mismo en la app), cancelar u oponerte al uso de tus datos personales.",
      `Para ejercerlos escribe a ${CONTACTO_PRIVACIDAD} indicando tu correo de cuenta y qué derecho quieres ejercer, o elimina tu cuenta directamente desde Configuración → "Eliminar cuenta".`,
    ],
  },
  {
    id: "push-cookies",
    titulo: "Notificaciones push y almacenamiento local",
    parrafos: [
      "Puedes desactivar las notificaciones push desde los permisos de tu navegador; ten en cuenta que esto reduce la capacidad de la app de avisarte oportunamente de una emergencia.",
      "Usamos almacenamiento local del navegador y un service worker para funcionar sin conexión y recibir push con la app cerrada, no para rastrearte con fines publicitarios.",
    ],
  },
  {
    id: "menores",
    titulo: "Menores de edad",
    parrafos: [
      "Un adulto responsable puede agregar a un menor a su grupo bajo su supervisión; el adulto es responsable de la información que comparta en su nombre.",
    ],
  },
  {
    id: "cambios-privacidad",
    titulo: "Cambios a este aviso",
    parrafos: [
      "Podemos actualizar este aviso; publicaremos la versión vigente aquí mismo, y si el cambio es importante te avisaremos por un medio adicional antes de que entre en vigor.",
    ],
  },
];
