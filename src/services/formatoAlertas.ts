import type { Alerta } from "./api";

// Cómo se muestra una alerta: lo comparten la lista de Inicio y la
// conversación del grupo.

export const ETIQUETA_ESTADO: Record<Alerta["status"], { texto: string; clase: string }> = {
  ACTIVE: { texto: "Activa", clase: "bg-red-600 text-white" },
  ACKNOWLEDGED: { texto: "Atendiendo", clase: "bg-amber-100 text-amber-800" },
  RESOLVED: { texto: "Resuelta", clase: "bg-slate-100 text-slate-500" },
};

export function origen(alerta: Alerta) {
  if (alerta.source === "DEVICE") {
    return `Botón ${alerta.device?.name || alerta.device?.deviceCode || ""}`.trim();
  }
  const quien = alerta.createdBy?.displayName || alerta.createdBy?.email;
  return quien ? `Reportó ${quien}` : "Desde la app";
}
