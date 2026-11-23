import type { Alerta } from "./api";

// Cómo se muestra una alerta: lo comparten la lista de Inicio y la
// conversación del grupo.

// Los colores salen de las variables del tema (src/index.css), no de clases
// fijas: así la pastilla se ve igual de bien en claro y en oscuro.
export const ETIQUETA_ESTADO: Record<Alerta["status"], { texto: string; fondo: string; color: string }> = {
  ACTIVE: { texto: "Activa", fondo: "var(--peligro)", color: "var(--fondo)" },
  ACKNOWLEDGED: { texto: "Enterado", fondo: "var(--alerta)", color: "var(--alerta-texto)" },
  RESOLVED: { texto: "Resuelta", fondo: "var(--superficie-suave)", color: "var(--texto-tenue)" },
};

export function origen(alerta: Alerta) {
  if (alerta.source === "DEVICE") {
    return `Botón ${alerta.device?.name || alerta.device?.deviceCode || ""}`.trim();
  }
  const quien = alerta.createdBy?.displayName || alerta.createdBy?.email;
  return quien ? `Reportó ${quien}` : "Desde la app";
}

// Quién tocó "Enterado" primero (la única transición que cuenta: la primera
// persona que la toca gana, ver /api/alerts/:id/atender). Null mientras
// siga ACTIVE.
export function enteradoPor(alerta: Alerta) {
  if (!alerta.acknowledgedBy) return null;
  return `Enterado: ${alerta.acknowledgedBy.displayName || alerta.acknowledgedBy.email}`;
}
