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
  groups: Grupo[];
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
      ...opciones.headers,
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
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
  members: { userId: string; email: string; displayName: string | null; role: "ADMIN" | "MEMBER" }[];
  devices: {
    id: string;
    deviceCode: string;
    name: string | null;
    // Ya calculado por el backend: OFFLINE/IRREGULAR salen del tiempo sin heartbeat.
    status: EstadoBoton;
    batteryLevel: number | null;
    firmwareVersion: string | null;
    lastSeenAt: string | null;
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
