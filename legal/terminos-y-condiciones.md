# Términos y Condiciones de Uso — SCILD

**Última actualización: [completar fecha antes de publicar]**

Estos Términos y Condiciones ("Términos") regulan el acceso y uso de la
aplicación web progresiva SCILD (la "App"), el sistema de botón físico de
emergencia asociado (el "Dispositivo" o "Botón") y los servicios de
backend que los conectan (en conjunto, el "Servicio"), operados por
**[RAZÓN SOCIAL / NOMBRE DEL RESPONSABLE]** ("SCILD", "nosotros" o "la
Empresa"), con domicilio en **[DOMICILIO FISCAL]**, [ciudad, estado, país].

Al crear una cuenta, instalar la App, vincular un Dispositivo o usar el
Servicio de cualquier forma, aceptas quedar obligado por estos Términos y
por el [Aviso de Privacidad](./aviso-de-privacidad.md). Si no estás de
acuerdo, no debes usar el Servicio.

> **Nota interna (borrador):** este documento es un punto de partida
> redactado a partir de la funcionalidad real de la App. No sustituye la
> revisión de un abogado antes de publicarlo, especialmente por tratarse
> de un producto de seguridad física donde la responsabilidad ante fallas
> puede tener consecuencias serias. Revisa en particular las secciones 6
> (Naturaleza del Servicio y limitación de responsabilidad), 12
> (Legislación aplicable) y los datos entre corchetes `[ ]`.

---

## 1. Qué es SCILD

SCILD es un sistema para gestionar botones físicos de emergencia
instalados en domicilios, comercios o establecimientos pequeños. Cuando
alguien presiona el Dispositivo, este avisa al backend de SCILD, y el
backend notifica —por notificación push y dentro de la App— a los
integrantes del grupo o establecimiento correspondiente. La App también
permite:

- Ver el estado y la conectividad del Dispositivo (en línea, sin
  conexión, irregular, en emergencia).
- Generar una alerta manualmente desde la App, sin necesidad de tocar el
  Dispositivo físico.
- Chatear entre los integrantes de un mismo grupo.
- Consultar la dirección/ubicación registrada del establecimiento.
- Administrar quién forma parte de cada grupo y quién puede disparar
  alertas.

La arquitectura es: **Dispositivo (ESP32) → Backend → App**. El
Dispositivo nunca se comunica directamente con los usuarios: toda la
información pasa por nuestros servidores.

## 2. Quién puede usar el Servicio

2.1. Debes tener **al menos 18 años** y capacidad legal para aceptar
estos Términos a fin de **registrar una cuenta**. Menores de edad pueden
formar parte de un grupo como integrantes agregados por un adulto
responsable (por ejemplo, un familiar), pero no pueden crear ni
administrar una cuenta por sí mismos.

2.2. Debes proporcionar información veraz y actualizada al registrarte
(correo electrónico, apodo/nombre para mostrar) y eres responsable de
mantenerla así.

2.3. El Servicio está diseñado para uso en **[país(es) de operación]**.
No garantizamos que funcione correctamente, ni que cumpla la normativa
local, fuera de ese territorio.

## 3. Cuenta, credenciales y seguridad del acceso

3.1. El registro y la autenticación se realizan mediante Firebase
Authentication. Eres responsable de mantener la confidencialidad de tu
contraseña y de cualquier actividad que ocurra en tu cuenta.

3.2. Debes notificarnos de inmediato ante cualquier uso no autorizado de
tu cuenta o sospecha de que tus credenciales fueron comprometidas, a
través de **[correo/canal de soporte]**.

3.3. Nosotros nunca manejamos ni almacenamos tu contraseña en texto
plano: la autenticación la valida directamente Firebase. No te pediremos
tu contraseña por correo, chat o llamada telefónica.

3.4. Puedes eliminar tu cuenta en cualquier momento desde la App
("Eliminar mi cuenta"). Eliminar la cuenta:

- Libera tu lugar como titular de cualquier Dispositivo del que seas
  titular (ver sección 4).
- No es reversible: perderás el acceso al historial de conversaciones y
  alertas asociado a tu cuenta, salvo la información que conservemos
  conforme al Aviso de Privacidad o por obligación legal.
- No elimina automáticamente grupos donde aún haya otros integrantes.

## 4. Cuentas "completas" e "invitadas"; titularidad del Dispositivo

4.1. **Cuenta invitada**: puede unirse a un grupo mediante código de
invitación, leer y escribir en el chat del grupo, y ver el estado de las
alertas. **No puede disparar alertas** de ningún tipo.

4.2. **Cuenta completa**: además de lo anterior, puede disparar alertas.
Se vuelve completa **únicamente** capturando el código de vinculación
impreso en la caja de un Dispositivo físico adquirido legítimamente (el
"código de la caja"). No existe otra forma de obtener esta función: no
se otorga, no se transfiere ni se vende de forma independiente al
Dispositivo.

4.3. Un mismo Dispositivo puede tener hasta **tres personas titulares**,
pensado para que lo compartan quienes viven o trabajan en el mismo lugar.
Un mismo Dispositivo puede avisar hasta a **tres grupos** distintos.

4.4. Eres responsable de resguardar el código de la caja y el
Dispositivo. Si el código se filtra a un tercero no autorizado, esa
persona podrá volverse titular y disparar alertas en tu nombre; repórtalo
de inmediato a **[correo/canal de soporte]** para que evaluemos rotar el
Dispositivo.

4.5. Adquirir un Dispositivo se realiza fuera de esta App, a través de
**[sitio de la tienda / SCILD-web]**, y se rige adicionalmente por las
condiciones de compra, envío, garantía y devoluciones publicadas ahí.

## 5. Grupos, roles y responsabilidades

5.1. Quien crea un grupo/establecimiento queda como **Administrador**
(ADMIN). Un grupo puede tener más de un administrador.

5.2. Los Administradores pueden: editar el nombre y dirección del grupo,
generar y revocar códigos de invitación, nombrar o quitar a otros
administradores, ajustar el cupo de integrantes, eliminar el grupo (si no
tiene Dispositivos vinculados) y expulsar contenido/gestionar el chat
dentro de lo que permite la App.

5.3. Eres responsable de la veracidad de la información del grupo
(dirección, nombre) y de a quién invitas: al aceptar un código de
invitación, esa persona podrá ver el chat, el estado de las alertas y,
si aplica, la ubicación del establecimiento.

5.4. La dirección del grupo es obligatoria porque es la información que
usan los demás integrantes para saber a dónde acudir o a dónde dirigir
ayuda externa en una emergencia. Mantenerla actualizada es tu
responsabilidad.

## 6. Naturaleza del Servicio y limitación de responsabilidad — LEE ESTO CON CUIDADO

6.1. **SCILD no es un servicio de emergencia ni sustituye a los números
de emergencia oficiales** (por ejemplo, 911 o el equivalente en tu país).
Ante una emergencia real que ponga en riesgo la vida o la integridad de
alguien, **contacta primero a los servicios de emergencia oficiales**; el
uso de SCILD es un complemento para avisar a tu grupo, no un canal
directo con autoridades, bomberos, policía o servicios médicos.

6.2. El Servicio depende de múltiples factores fuera de nuestro control
absoluto, entre otros: conexión a internet del Dispositivo y del router
del cliente, suministro eléctrico, disponibilidad de los proveedores de
notificaciones push (Google Firebase Cloud Messaging), disponibilidad de
la base de datos y de los servidores donde corre el backend, y el
correcto funcionamiento del navegador/sistema operativo del usuario. **No
garantizamos que una alerta llegue de forma instantánea, ni que llegue en
absoluto**, aunque el Servicio esté diseñado con reintentos y mecanismos
de confiabilidad razonables.

6.3. En particular, y de forma no exhaustiva:

- Si el Dispositivo pierde conexión a internet, no puede enviar ni
  recibir nada del backend hasta recuperarla.
- Los proveedores de infraestructura en capa gratuita (por ejemplo, bases
  de datos que "duermen" tras inactividad) pueden introducir demoras de
  algunos segundos en la primera solicitud tras un periodo sin uso.
- Las notificaciones push requieren que el usuario las haya autorizado en
  su navegador/dispositivo y, en algunos sistemas operativos, que la App
  esté instalada como aplicación (no solo abierta en el navegador).
- Un tercero con acceso físico al Dispositivo o a la red donde está
  conectado podría interferir con su funcionamiento.

6.4. **En la máxima medida permitida por la ley aplicable**, SCILD, sus
operadores, empleados y colaboradores no serán responsables por daños
indirectos, incidentales, especiales, punitivos o consecuentes
(incluyendo, sin limitación, lesiones, pérdidas humanas, materiales o
económicas) derivados de: (a) la imposibilidad de enviar o recibir una
alerta; (b) demoras en su entrega; (c) fallas del Dispositivo, del
backend, de la conectividad o de terceros proveedores; (d) el uso
indebido del Servicio por parte de otro usuario; o (e) decisiones
tomadas —o no tomadas— con base en la información mostrada en la App.

6.5. Esta limitación no aplica en la medida en que la ley no permita
excluir o limitar la responsabilidad (por ejemplo, en casos de dolo o
negligencia grave comprobada de nuestra parte), ni pretende limitar
derechos que la ley reconozca de forma irrenunciable al consumidor.

6.6. El Servicio se ofrece **"tal cual" y "según disponibilidad"**,
actualmente en fase de mejora continua. Podemos suspenderlo
temporalmente por mantenimiento, actualizaciones o causas de fuerza
mayor, procurando avisar con la anticipación que sea razonablemente
posible.

## 7. Uso aceptable

Al usar el Servicio, te comprometes a **no**:

7.1. Generar alertas falsas o de broma. Disparar una alerta sabiendo que
no existe una situación real es un uso indebido del Servicio y puede
tener consecuencias legales en tu jurisdicción (por ejemplo, por uso
indebido de sistemas de auxilio), además de dar lugar a la suspensión de
tu cuenta.

7.2. Usar el chat del grupo para acosar, amenazar, difundir contenido
ilegal, difamatorio, discriminatorio o que viole derechos de terceros.

7.3. Intentar vulnerar, sobrecargar o acceder sin autorización a los
sistemas del backend, a las cuentas de otros usuarios, o a Dispositivos
que no te pertenecen (por ejemplo, probando códigos de vinculación ajenos
por fuerza bruta).

7.4. Realizar ingeniería inversa, descompilar o modificar el firmware o
software del Servicio salvo en la medida en que la ley lo permita
expresamente.

7.5. Usar el Servicio para fines distintos al de seguridad personal o
del establecimiento para el que fue diseñado.

7.6. Compartir tu cuenta, contraseña o el código de la caja con personas
ajenas al grupo o al establecimiento correspondiente.

El incumplimiento de esta sección puede resultar en la suspensión o
cancelación de tu cuenta, sin perjuicio de otras acciones legales que
correspondan.

## 8. Contenido generado por el usuario

8.1. Eres el único responsable del contenido que envíes en el chat de
grupo (mensajes, apodo, nombre y dirección del establecimiento).

8.2. Nos reservas —y así lo autorizas— una licencia limitada para
almacenar, transmitir y mostrar ese contenido **únicamente** a los demás
integrantes del grupo correspondiente, con el fin de operar el Servicio.
No usamos el contenido del chat con fines publicitarios.

8.3. No publiques en el chat información sensible que no sea necesaria
para la operación del grupo (por ejemplo, contraseñas, datos bancarios o
información médica detallada de terceros).

8.4. Podemos remover contenido o suspender cuentas que incumplan la
sección 7, previa notificación cuando sea razonablemente posible.

## 9. El Dispositivo físico

9.1. El Dispositivo se adquiere por separado, a través del canal de venta
correspondiente, y puede estar sujeto a garantía conforme a las
condiciones de venta publicadas ahí.

9.2. El identificador secreto del Dispositivo (`deviceSecret`) se
entrega **una sola vez** al darlo de alta y no puede recuperarse después;
si se pierde, es necesario dar de baja el Dispositivo y sustituirlo por
uno nuevo. No compartas este identificador con nadie: es lo único que
permite que el Dispositivo hable con el backend en tu nombre.

9.3. Eres responsable de la instalación, alimentación eléctrica y
conexión a internet del Dispositivo en tu domicilio o establecimiento.

9.4. El Dispositivo puede requerir actualizaciones de configuración o
firmware que se aplican de forma remota a través del Servicio.

## 10. Propiedad intelectual

10.1. El Servicio, su código, diseño, marca, logotipos y contenidos
propios (excluyendo el contenido generado por los usuarios) son
propiedad de **[RAZÓN SOCIAL]** o de sus licenciantes, y están protegidos
por las leyes de propiedad intelectual aplicables.

10.2. Se te concede una licencia limitada, personal, no exclusiva,
intransferible y revocable para usar la App conforme a estos Términos.
Ninguna disposición te otorga derechos sobre el código fuente, las
marcas, ni el firmware del Dispositivo más allá de lo estrictamente
necesario para usarlo conforme a su fin.

## 11. Suspensión y terminación

11.1. Podemos suspender o cancelar tu acceso al Servicio, con o sin
previo aviso, si: incumples estos Términos, generas riesgo para otros
usuarios, usas el Servicio de forma fraudulenta, o por requerimiento
legal.

11.2. Puedes dejar de usar el Servicio y eliminar tu cuenta en cualquier
momento (ver sección 3.4).

11.3. Las secciones que por su naturaleza deban sobrevivir a la
terminación (incluyendo, sin limitación, la 6, 8.2, 10 y 12) seguirán
vigentes después de que termine tu relación con el Servicio.

## 12. Legislación aplicable y jurisdicción

Estos Términos se rigen por las leyes de **[país/estado, p. ej. México y,
en lo aplicable, las leyes federales mexicanas]**, sin perjuicio de las
normas de protección al consumidor que, en su caso, resulten aplicables
de forma irrenunciable en tu lugar de residencia. Cualquier controversia
se someterá a los tribunales competentes de **[ciudad/jurisdicción]**,
renunciando a cualquier otro fuero que pudiera corresponder.

## 13. Cambios a estos Términos

Podemos actualizar estos Términos para reflejar cambios en el Servicio o
en la normativa aplicable. Si el cambio es sustancial, te lo avisaremos
dentro de la App o por correo electrónico con una anticipación razonable
antes de que entre en vigor. El uso continuado del Servicio después de la
fecha de entrada en vigor constituye tu aceptación de los nuevos
Términos.

## 14. Contacto

Para dudas, aclaraciones o para reportar un problema de seguridad,
escríbenos a **[correo de soporte]** o a través de **[canal de contacto
dentro de la App, sección Ayuda]**.
