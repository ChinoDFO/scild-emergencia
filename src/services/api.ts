import { auth } from "../firebase/config";

const API_URL = import.meta.env.VITE_API_URL;

export interface Grupo {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
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

export function crearGrupo(datos: { name: string; address?: string }) {
  return llamarBackend("/api/groups", { method: "POST", body: JSON.stringify(datos) });
}

export function unirseAGrupo(inviteCode: string) {
  return llamarBackend("/api/groups/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}
