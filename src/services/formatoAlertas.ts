import type { Alerta } from "./api";

// Cómo se muestra una alerta: lo comparten la lista de Inicio y la
// conversación del grupo.

// Los colores salen de las variables del tema (src/index.css), no de clases
// fijas: así la pastilla se ve igual de bien en claro y en oscuro.
export const ETIQUETA_ESTADO: Record<Alerta["status"], { texto: string; fondo: string; color: string }> = {
  ACTIVE: { texto: "Activa", fondo: "var(--peligro)", color: "var(--fondo)" },
  ACKNOWLEDGED: { texto: "Atendiendo", fondo: "var(--alerta)", color: "var(--alerta-texto)" },
  RESOLVED: { texto: "Resuelta", fondo: "var(--superficie-suave)", color: "var(--texto-tenue)" },
};

export function origen(alerta: Alerta) {
  if (alerta.source === "DEVICE") {
    return `Botón ${alerta.device?.name || alerta.device?.deviceCode || ""}`.trim();
  }
  const quien = alerta.createdBy?.displayName || alerta.createdBy?.email;
  return quien ? `Reportó ${quien}` : "Desde la app";
}
