import { auth } from "../firebase/config";

const API_URL = import.meta.env.VITE_API_URL;

export interface Grupo {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  // Mensajes del chat que esta persona no ha leído.
  sinLeer: number;
}

export interface Perfil {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  // Si la cuenta puede disparar alertas: es titular de un botón o un titular
  // le regaló uno de sus accesos. Sin esto solo se participa en el chat.
  accesoCompleto: boolean;
  esTitular: boolean;
  // Administrador de la plataforma (nosotros): ve el panel de solicitudes.
  esAdminPlataforma: boolean;
  groups: Grupo[];
}

// --- Acceso de la cuenta (apartado de Códigos) ------------------------------

export interface BotonDeAcceso {
  id: string;
  nombre: string;
  deviceCode: string;
  // A qué grupo le avisa este botón, si ya se vinculó a uno.
  grupo: { id: string; name: string } | null;
  // Las dos personas que comparten el botón.
  titulares: { userId: string; nombre: string }[];
  // Accesos comprados para repartir entre los invitados del grupo.
  accesos: { comprados: number; repartidos: number; libres: number };
  repartidosA: { userId: string; nombre: string; email: string }[];
}

export interface Acceso {
  completo: boolean;
  esTitular: boolean;
  accesoDe: string | null;
  botones: BotonDeAcceso[];
}

export function obtenerAcceso(): Promise<Acceso> {
  return llamarBackend("/api/acceso");
}

// Vincula la cuenta a un botón con el código impreso en su caja. El mismo
// código sirve para dos personas.
export function vincularCodigo(claimCode: string) {
  return llamarBackend("/api/acceso/vincular", {
    method: "POST",
    body: JSON.stringify({ claimCode }),
  });
}

// El titular reparte uno de los accesos que compró: esa persona pasa de
// invitada a tener las funciones completas.
export function otorgarAcceso(deviceId: string, userId: string) {
  return llamarBackend("/api/acceso/otorgar", {
    method: "POST",
    body: JSON.stringify({ deviceId, userId }),
  });
}

export function retirarAcceso(deviceId: string, userId: string) {
  return llamarBackend("/api/acceso/otorgar", {
    method: "DELETE",
    body: JSON.stringify({ deviceId, userId }),
  });
}

async function llamarBackend(ruta: string, opciones: RequestInit = {}) {
  const usuario = auth.currentUser;
  if (!usuario) {
    throw new Error("No hay sesión activa");
  }

  const idToken = await usuario.getIdToken();

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${idToken}`,
      // JSON por defecto, pero quien llama lo puede cambiar: el comprobante
      // de pago se manda como imagen cruda, no como JSON.
      "Content-Type": "application/json",
      ...opciones.headers,
    },
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(datos?.error ?? "Error al comunicarse con el servidor");
  }

  return datos;
}

export function obtenerPerfil(): Promise<Perfil> {
  return llamarBackend("/api/auth/me");
}

// Apodo con el que te ven los demás en tus grupos ("Mamá", "Cajero").
export function actualizarApodo(displayName: string): Promise<{ displayName: string }> {
  return llamarBackend("/api/auth/me", { method: "PATCH", body: JSON.stringify({ displayName }) });
}

export function crearGrupo(datos: { name: string; address: string }): Promise<{ id: string; name: string }> {
  return llamarBackend("/api/groups", { method: "POST", body: JSON.stringify(datos) });
}

export function unirseAGrupo(inviteCode: string): Promise<{ groupId: string; groupName: string }> {
  return llamarBackend("/api/groups/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

// Token de FCM de este navegador, para que el backend sepa a dónde mandarle
// las alertas de los grupos del usuario.
export function registrarTokenPush(token: string) {
  return llamarBackend("/api/notifications/token", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function borrarTokenPush(token: string) {
  return llamarBackend("/api/notifications/token", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

export type EstadoBoton = "ONLINE" | "IRREGULAR" | "OFFLINE" | "EMERGENCY" | "MAINTENANCE";

export interface DetalleGrupo {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  role: "ADMIN" | "MEMBER";
  myUserId: string;
  // Solo viene para el ADMIN del grupo.
  inviteCode: string | null;
  // Si puedes disparar alertas. Es propiedad de tu cuenta, no de este grupo:
  // sin esto solo se participa en el chat y el botón SOS ni aparece.
  puedoAlertar: boolean;
  // Diez lugares por cada botón vinculado al grupo.
  cupos: {
    total: number;
    ocupados: number;
    libres: number;
    // Miembros cuyo botón se desvinculó (siguen en el grupo, sin respaldo).
    sinRespaldo: number;
    porBoton: { deviceId: string; nombre: string; ocupados: number; libres: number }[];
  };
  members: {
    userId: string;
    email: string;
    displayName: string | null;
    role: "ADMIN" | "MEMBER";
    // Titular de un botón o con un acceso regalado; si no, es invitado.
    accesoCompleto: boolean;
    seatDeviceId: string | null;
  }[];
  devices: {
    id: string;
    deviceCode: string;
    name: string | null;
    // Ya calculado por el backend: OFFLINE/IRREGULAR salen del tiempo sin heartbeat.
    status: EstadoBoton;
    batteryLevel: number | null;
    firmwareVersion: string | null;
    lastSeenAt: string | null;
    // Quién lo vinculó: en un coto, de qué casa es el botón.
    owner: { userId: string; nombre: string } | null;
    // Las dos personas que comparten el botón.
    titulares: { userId: string; nombre: string }[];
    puedoDesvincular: boolean;
  }[];
}

export type EstadoAlerta = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface TipoAlerta {
  id: string;
  etiqueta: string;
  emoji: string;
}

export interface Alerta {
  id: string;
  groupId: string;
  source: "DEVICE" | "APP";
  type: string;
  // Ya resuelto por el backend a partir de su catálogo.
  tipo: TipoAlerta;
  status: EstadoAlerta;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  group: { name: string };
  device: { name: string | null; deviceCode: string } | null;
  createdBy: { email: string; displayName: string | null } | null;
}

export function obtenerGrupo(id: string): Promise<DetalleGrupo> {
  return llamarBackend(`/api/groups/${encodeURIComponent(id)}`);
}

export function listarAlertas(filtro: { groupId?: string; soloAbiertas?: boolean } = {}): Promise<Alerta[]> {
  const parametros = new URLSearchParams();
  if (filtro.groupId) parametros.set("groupId", filtro.groupId);
  if (filtro.soloAbiertas) parametros.set("soloAbiertas", "true");
  const query = parametros.toString();
  return llamarBackend(`/api/alerts${query ? `?${query}` : ""}`);
}

// El catálogo vive en el backend (src/tiposAlerta.js). Se pide una vez por
// sesión: cambia solo cuando se despliega una versión nueva del backend.
let tiposEnCache: Promise<TipoAlerta[]> | null = null;
export function listarTiposAlerta(): Promise<TipoAlerta[]> {
  tiposEnCache ??= llamarBackend("/api/alerts/tipos").catch((e: unknown) => {
    tiposEnCache = null;
    throw e;
  });
  return tiposEnCache!;
}

export function generarAlerta(groupId: string, type: string): Promise<Alerta> {
  return llamarBackend("/api/alerts", { method: "POST", body: JSON.stringify({ groupId, type }) });
}

export function cambiarEstadoAlerta(id: string, accion: "atender" | "resolver"): Promise<Alerta> {
  return llamarBackend(`/api/alerts/${encodeURIComponent(id)}/${accion}`, { method: "POST" });
}

export function actualizarGrupo(
  id: string,
  datos: { name?: string; address?: string }
): Promise<{ id: string; name: string; address: string }> {
  return llamarBackend(`/api/groups/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(datos),
  });
}

export function regenerarCodigoInvitacion(id: string): Promise<{ inviteCode: string }> {
  return llamarBackend(`/api/groups/${encodeURIComponent(id)}/invite-code`, { method: "POST" });
}

export interface Mensaje {
  id: string;
  groupId: string;
  content: string;
  createdAt: string;
  autor: { id: string; nombre: string };
}

export function listarMensajes(
  groupId: string,
  antesDe?: string
): Promise<{ mensajes: Mensaje[]; hayMas: boolean }> {
  const query = antesDe ? `?antesDe=${encodeURIComponent(antesDe)}` : "";
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}/messages${query}`);
}

export function enviarMensaje(groupId: string, content: string): Promise<Mensaje> {
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// Marca el chat como leído hasta ahora: pone el contador en cero y hace que
// el próximo aviso push traiga el mensaje en vez de "N mensajes nuevos".
export function marcarChatLeido(groupId: string) {
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}/read`, { method: "POST" });
}

export function salirDelGrupo(groupId: string): Promise<{ ok: boolean; grupoBorrado: boolean }> {
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}/members/me`, { method: "DELETE" });
}

// Pide el nombre del grupo escrito igual, como confirmación.
export function eliminarGrupo(groupId: string, confirmarNombre: string) {
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmarNombre }),
  });
}

export function cambiarRolMiembro(groupId: string, userId: string, role: "ADMIN" | "MEMBER") {
  return llamarBackend(
    `/api/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: "PATCH", body: JSON.stringify({ role }) }
  );
}

// Vincula un botón al grupo con el código impreso en su caja.
export function vincularBoton(groupId: string, claimCode: string, name?: string) {
  return llamarBackend(`/api/groups/${encodeURIComponent(groupId)}/devices/claim`, {
    method: "POST",
    body: JSON.stringify({ claimCode, ...(name ? { name } : {}) }),
  });
}

// Lo suelta del grupo. El código de la caja sigue sirviendo para volver a
// vincularlo, aquí o en otro grupo.
export function desvincularBoton(groupId: string, deviceId: string) {
  return llamarBackend(
    `/api/groups/${encodeURIComponent(groupId)}/devices/${encodeURIComponent(deviceId)}`,
    { method: "DELETE" }
  );
}

// --- Ampliar el límite: chat con los administradores ------------------------

export type EstadoPago = "ABIERTA" | "EN_REVISION" | "APROBADA" | "RECHAZADA" | "CANCELADA";

export interface MensajePago {
  id: string;
  from: "CLIENTE" | "SOPORTE";
  kind: string;
  body: string;
  createdAt: string;
}

export interface SolicitudPago {
  id: string;
  deviceId: string;
  boton: string;
  status: EstadoPago;
  proofAt: string | null;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  // Ya toca mandar la captura: dijo "Ya pagué" y todavía no manda ninguna.
  esperaComprobante: boolean;
  messages: MensajePago[];
}

export interface DatosDePago {
  banco: string;
  clabe: string;
  titular: string;
  monto: string;
  contacto: string;
  accesos: number;
}

export function obtenerPagos(): Promise<{
  datos: DatosDePago;
  respuestas: { id: string; texto: string }[];
  solicitudes: SolicitudPago[];
}> {
  return llamarBackend("/api/pagos");
}

export function abrirSolicitudPago(deviceId: string): Promise<SolicitudPago> {
  return llamarBackend("/api/pagos", { method: "POST", body: JSON.stringify({ deviceId }) });
}

// El cliente solo manda mensajes del catálogo; el texto lo pone el backend.
export function responderEnPago(id: string, kind: string): Promise<SolicitudPago> {
  return llamarBackend(`/api/pagos/${encodeURIComponent(id)}/mensajes`, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

// La captura va como imagen cruda, no como JSON ni multipart: son unos
// cientos de kilobytes y así el backend no necesita otra dependencia.
export function subirComprobante(id: string, archivo: File): Promise<SolicitudPago> {
  return llamarBackend(`/api/pagos/${encodeURIComponent(id)}/comprobante`, {
    method: "POST",
    headers: { "Content-Type": archivo.type },
    body: archivo,
  });
}

// --- Panel de administradores de la plataforma ------------------------------

export interface SolicitudAdmin {
  id: string;
  status: EstadoPago;
  createdAt: string;
  proofAt: string | null;
  reviewedAt: string | null;
  revisadaPor: string | null;
  note: string | null;
  cliente: { userId: string; nombre: string; email: string; cuentaDesde: string };
  boton: {
    deviceId: string;
    nombre: string;
    deviceCode: string;
    grupo: string | null;
    accesosComprados: number;
    accesosRepartidos: number;
  };
  // Enlace firmado que caduca; solo viene para lo que está por revisar.
  comprobante: string | null;
  hayComprobante: boolean;
  messages: MensajePago[];
}

export interface ClienteAdmin {
  deviceId: string;
  nombre: string;
  deviceCode: string;
  grupo: string | null;
  cliente: { userId: string; nombre: string; email: string; registradoEl: string };
  acompanante: string | null;
  ampliado: boolean;
  accesosComprados: number;
  accesosRepartidos: number;
  lugaresOcupados: number;
}

export function listarSolicitudes(filtro: { estado?: string; q?: string } = {}): Promise<SolicitudAdmin[]> {
  const parametros = new URLSearchParams();
  if (filtro.estado) parametros.set("estado", filtro.estado);
  if (filtro.q) parametros.set("q", filtro.q);
  const query = parametros.toString();
  return llamarBackend(`/api/admin/solicitudes${query ? `?${query}` : ""}`);
}

export function aprobarSolicitud(id: string): Promise<{ accesosComprados: number }> {
  return llamarBackend(`/api/admin/solicitudes/${encodeURIComponent(id)}/aprobar`, { method: "POST" });
}

export function rechazarSolicitud(id: string, note: string) {
  return llamarBackend(`/api/admin/solicitudes/${encodeURIComponent(id)}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

// Soporte sí escribe texto libre: del otro lado estamos nosotros.
export function responderComoSoporte(id: string, body: string): Promise<MensajePago> {
  return llamarBackend(`/api/admin/solicitudes/${encodeURIComponent(id)}/mensajes`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function listarClientes(filtro: { ampliados?: string; q?: string } = {}): Promise<ClienteAdmin[]> {
  const parametros = new URLSearchParams();
  if (filtro.ampliados) parametros.set("ampliados", filtro.ampliados);
  if (filtro.q) parametros.set("q", filtro.q);
  const query = parametros.toString();
  return llamarBackend(`/api/admin/clientes${query ? `?${query}` : ""}`);
}

// Amplía el límite a mano, sin pasar por una solicitud.
export function ampliarLimite(deviceId: string, accesos?: number): Promise<{ accesosComprados: number }> {
  return llamarBackend(`/api/admin/clientes/${encodeURIComponent(deviceId)}/accesos`, {
    method: "POST",
    body: JSON.stringify(accesos === undefined ? {} : { accesos }),
  });
}
