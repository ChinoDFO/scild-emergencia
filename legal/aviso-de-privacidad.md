# Aviso de Privacidad — SCILD

**Última actualización: [completar fecha antes de publicar]**

> **Nota interna (borrador):** este aviso sigue, a grandes rasgos, la
> estructura que pide la Ley Federal de Protección de Datos Personales en
> Posesión de los Particulares (LFPDPPP) de México: responsable,
> finalidades, datos recabados, transferencias, derechos ARCO y mecanismo
> para ejercerlos. Si el Servicio opera también en otros países (p. ej.
> con usuarios en la Unión Europea, donde aplicaría el RGPD/GDPR, o en
> California, donde aplicaría la CCPA), este documento necesita ajustes
> adicionales que un abogado especializado en protección de datos debe
> revisar antes de publicarlo. Completa todos los campos entre
> corchetes `[ ]`.

## 1. Responsable del tratamiento de tus datos personales

**[RAZÓN SOCIAL / NOMBRE DEL RESPONSABLE]** ("SCILD", "nosotros"), con
domicilio en **[DOMICILIO FISCAL COMPLETO]**, es responsable del
tratamiento de tus datos personales conforme a este Aviso de Privacidad,
en relación con la aplicación web progresiva SCILD, el backend que la
sostiene y el Dispositivo físico de emergencia asociado.

Puedes contactarnos sobre temas de privacidad en **[correo dedicado a
privacidad, p. ej. privacidad@scild...]**.

## 2. Datos personales que recabamos

### 2.1. Datos que nos das directamente

- **Datos de cuenta**: correo electrónico y contraseña (la contraseña la
  gestiona directamente Firebase Authentication; nosotros nunca la vemos
  ni la almacenamos).
- **Apodo / nombre para mostrar**: cómo te ven los demás integrantes de
  tu grupo (por ejemplo, "Mamá", "Cajero"). Puede ser un nombre real o
  un alias, a tu elección.
- **Datos del grupo/establecimiento**: nombre del grupo y **dirección**
  (obligatoria, porque es la información que usan los demás integrantes
  para saber a dónde dirigirse o a dónde enviar ayuda en una emergencia).
  Si se habilita, también coordenadas de ubicación (latitud/longitud).
- **Contenido del chat**: los mensajes que envías dentro del chat de tu
  grupo.
- **Configuración del Dispositivo**: nombre que le asignas al botón,
  intervalos de aviso (heartbeat), tiempo de espera entre alertas
  (cooldown) y, si la capturas, el nombre y la contraseña de una red
  WiFi de respaldo para el Dispositivo. **Esta contraseña de respaldo se
  transmite al Dispositivo para que pueda conectarse a esa red**; te
  recomendamos usar una red dedicada o de invitados en vez de tu red
  principal si te preocupa compartir esa contraseña con nosotros.

### 2.2. Datos que se generan por el uso del Servicio

- **Datos de alertas**: tipo de alerta, quién la generó (usuario o
  Dispositivo), hora de creación, quién la atendió y quién la marcó como
  resuelta.
- **Telemetría del Dispositivo**: si está conectado a internet, dirección
  IP, intensidad de señal WiFi (RSSI), fallas de conexión reportadas,
  nivel de batería (si aplica) y versión del firmware instalado. Esta
  información alimenta la pantalla de monitoreo del botón dentro de la
  App.
- **Registro de auditoría**: acciones administrativas relevantes dentro
  de un grupo (por ejemplo, cambios de administrador, ediciones de
  dirección, eliminación de integrantes), para fines de trazabilidad y
  seguridad.
- **Identificadores técnicos**: token de notificaciones push de tu
  navegador (Firebase Cloud Messaging), para poder enviarte avisos; se
  elimina al cerrar sesión.
- **Datos de uso básicos**: registros técnicos del servidor (por
  ejemplo, marcas de tiempo de solicitudes) para fines de seguridad,
  prevención de abuso y diagnóstico de fallas.

### 2.3. Datos que NO recabamos

- No solicitamos ni almacenamos datos financieros o de pago dentro de la
  App (actualmente el Servicio no cobra dentro de la aplicación; la
  compra del Dispositivo, si implica un pago, se procesa fuera de esta
  App a través de **[tienda / SCILD-web]** y se rige por su propio aviso
  de privacidad).
- No solicitamos deliberadamente datos sensibles conforme a la ley
  (origen étnico, creencias religiosas, salud, preferencias sexuales,
  etc.). Te pedimos que **no** incluyas este tipo de información en el
  chat de grupo salvo que sea estrictamente necesario y lo hagas de forma
  voluntaria; en ese caso, su tratamiento seguirá las mismas finalidades
  y protecciones descritas en este aviso, limitado a mostrarlo a los
  integrantes del grupo correspondiente.

## 3. Finalidades del tratamiento

### 3.1. Finalidades necesarias para el Servicio (no puedes optar por no
proporcionarlas si quieres usar SCILD)

- Crear y administrar tu cuenta y verificar tu identidad al iniciar
  sesión.
- Operar los grupos: mostrar quién los integra, permitir el chat entre
  sus miembros y mostrar la dirección del establecimiento a quienes
  forman parte de él.
- Recibir y procesar alertas generadas por el Dispositivo o desde la
  App, y notificar a los integrantes del grupo correspondiente por
  notificación push y dentro de la App.
- Mostrar el estado y la telemetría del Dispositivo para que puedas
  monitorear si está en línea, sin conexión o en emergencia.
- Aplicar la configuración que definas al Dispositivo (nombre,
  intervalos, red de respaldo).
- Prevenir fraude, abuso del Servicio (por ejemplo, alertas falsas
  reiteradas) y mantener la seguridad de la plataforma.
- Dar soporte técnico cuando lo solicites.
- Cumplir obligaciones legales aplicables.

### 3.2. Finalidades secundarias (opcionales)

- Enviarte comunicaciones sobre mejoras al Servicio, nuevas funciones o
  encuestas de satisfacción.
- Elaborar estadísticas internas y anónimas sobre el uso del Servicio
  para mejorarlo.

Puedes oponerte a estas finalidades secundarias en cualquier momento sin
que ello afecte tu acceso al Servicio, escribiendo a **[correo de
privacidad]** con el asunto "Finalidades secundarias".

## 4. Transferencias de datos personales

Para operar el Servicio, compartimos ciertos datos con proveedores de
infraestructura que actúan como encargados del tratamiento en nuestro
nombre, bajo los acuerdos de confidencialidad y protección de datos que
ellos mismos ofrecen:

| Proveedor | Qué procesa | Con qué fin |
|---|---|---|
| **Google Firebase** (Authentication, Cloud Messaging) | Correo electrónico, credenciales de acceso, token de notificaciones push | Iniciar sesión y enviarte notificaciones push |
| **Neon** (base de datos PostgreSQL) | Todos los datos descritos en la sección 2, salvo la contraseña | Almacenar la información necesaria para operar el Servicio |
| **[Proveedor de hosting del backend, p. ej. Render/Railway]** | Tráfico de la API y del chat en tiempo real | Ejecutar el servidor que conecta la App con el Dispositivo |

No vendemos, rentamos ni compartimos tus datos personales con terceros
con fines publicitarios o de mercadotecnia ajenos al Servicio. Solo
transferimos datos adicionales a terceros cuando:

- Lo exige una autoridad competente conforme a la ley.
- Es necesario para proteger los derechos, la seguridad o la propiedad de
  SCILD, de nuestros usuarios o del público.
- Cuentas con nuestro consentimiento expreso para un fin distinto a los
  aquí descritos.

## 5. Cómo protegemos tus datos

- Tu contraseña la gestiona Firebase Authentication; nunca la recibimos
  ni la almacenamos nosotros.
- El identificador secreto del Dispositivo se guarda **siempre
  cifrado (hash)**, nunca en texto plano; ni siquiera nosotros podemos
  recuperarlo una vez generado.
- El acceso a los datos de un grupo está restringido a sus propios
  integrantes; nadie puede ver el chat, las alertas o los Dispositivos de
  un grupo del que no forma parte.
- Usamos comunicación cifrada (HTTPS) entre la App y el backend [una vez
  publicado con certificado válido — confirmar antes de publicar este
  aviso si el entorno de producción ya corre sobre HTTPS].
- Aplicamos límites de solicitudes (rate limiting) y cabeceras de
  seguridad para reducir el riesgo de accesos indebidos.

Ningún sistema es 100% infalible. Si detectamos una vulneración de
seguridad que afecte tus datos personales, te lo notificaremos conforme
lo exija la ley aplicable.

## 6. Derechos ARCO: Acceso, Rectificación, Cancelación y Oposición

Tienes derecho a:

- **Acceder** a los datos personales que tenemos sobre ti.
- **Rectificarlos** si son inexactos o están desactualizados (algunos,
  como tu apodo, puedes editarlos tú mismo directamente en la App, en
  Configuración/Perfil).
- **Cancelarlos** cuando consideres que no se requieren para las
  finalidades aquí descritas.
- **Oponerte** al uso de tus datos para fines específicos.

### Cómo ejercerlos

- **Desde la App**: puedes editar tu apodo, la dirección del grupo (si
  eres administrador) y eliminar tu cuenta por completo desde
  Configuración → "Eliminar mi cuenta". Al eliminar tu cuenta:
  - Se elimina tu perfil de nuestra base de datos y de Firebase.
  - Se libera tu lugar como titular de cualquier Dispositivo del que
    fueras titular.
  - El contenido que hayas enviado en chats de grupos donde sigue habiendo
    otros integrantes puede conservarse dentro del historial de esos
    grupos, ya que forma parte de una conversación compartida; si deseas
    la eliminación de mensajes específicos, contáctanos.
- **Por correo**: escribe a **[correo de privacidad]** indicando tu
  nombre, el correo asociado a tu cuenta y el derecho que deseas ejercer.
  Responderemos dentro del plazo que marque la ley aplicable (en México,
  la LFPDPPP prevé un plazo de hasta 20 días hábiles para dar respuesta).
  Podremos pedirte datos adicionales para verificar tu identidad antes de
  procesar la solicitud.

Puedes también **revocar tu consentimiento** para el tratamiento de tus
datos en cualquier momento, entendiendo que ello puede implicar que ya
no podamos seguir prestándote el Servicio (por ejemplo, si revocas el
consentimiento para almacenar tu correo, no podremos mantener tu cuenta
activa).

## 7. Notificaciones push y cómo desactivarlas

Las notificaciones push son el mecanismo principal para avisarte de una
alerta cuando no tienes la App abierta. Puedes:

- Desactivarlas desde los permisos de notificaciones de tu navegador o
  sistema operativo.
- Revocar el token de tu dispositivo cerrando sesión en la App, lo que
  elimina el token registrado en nuestros servidores.

Ten en cuenta que **desactivar las notificaciones push reduce la
capacidad del Servicio para avisarte oportunamente de una emergencia**
(ver también la sección 6 de los
[Términos y Condiciones](./terminos-y-condiciones.md)).

## 8. Uso de cookies y tecnologías similares

La App usa almacenamiento local del navegador (`localStorage`,
`IndexedDB`) y un service worker para funcionar sin conexión y recibir
notificaciones push con la App cerrada, no para rastrearte con fines
publicitarios. No usamos cookies de terceros con fines de publicidad ni
compartimos esta información con redes de anuncios.

## 9. Menores de edad

El Servicio no está dirigido a que menores de edad creen cuentas por sí
mismos. Un adulto responsable puede agregar a un menor como integrante
de su grupo (por ejemplo, un hijo o hija) bajo su supervisión; en ese
caso, el adulto es responsable de la información que comparta en nombre
del menor y de vigilar el uso que el menor haga del chat de grupo.

## 10. Conservación de tus datos

Conservamos tus datos personales mientras tu cuenta permanezca activa y,
después de eliminarla, durante el plazo adicional que sea necesario para
cumplir obligaciones legales, resolver disputas o hacer valer nuestros
acuerdos, tras lo cual los eliminamos o anonimizamos de forma segura.

## 11. Cambios a este Aviso de Privacidad

Podemos actualizar este Aviso para reflejar cambios en el Servicio, en
nuestras prácticas de datos o en la normativa aplicable. Publicaremos la
versión vigente dentro de la App con la fecha de última actualización, y
si el cambio es sustancial te lo notificaremos por un medio adicional
(por ejemplo, correo electrónico o un aviso dentro de la App) antes de
que entre en vigor.

## 12. Contacto

Si tienes dudas sobre este Aviso de Privacidad o sobre cómo tratamos tus
datos personales, escríbenos a **[correo de privacidad]**.

Si consideras que tu derecho a la protección de datos personales ha sido
vulnerado, tienes derecho a acudir ante la autoridad de protección de
datos que corresponda en tu país (en México, el **Instituto Nacional de
Transparencia, Acceso a la Información y Protección de Datos Personales,
INAI/[su sucesor vigente]**).
