import { useCallback, useEffect, useState } from "react";
import { cambiarEstadoAlerta, listarAlertas, type Alerta } from "../services/api";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { useAlReconectar, useEventoTiempoReal } from "../services/tiempoReal";

// Los cambios llegan al instante por Socket.IO. Esto es solo el respaldo por
// si la conexión en tiempo real está caída sin que nadie lo note.
const REFRESCO_MS = 60_000;

const ETIQUETA_ESTADO: Record<Alerta["status"], { texto: string; clase: string }> = {
  ACTIVE: { texto: "Activa", clase: "bg-red-600 text-white" },
  ACKNOWLEDGED: { texto: "Atendiendo", clase: "bg-amber-100 text-amber-800" },
  RESOLVED: { texto: "Resuelta", clase: "bg-slate-100 text-slate-500" },
};

function origen(alerta: Alerta) {
  if (alerta.source === "DEVICE") {
    return `Botón ${alerta.device?.name || alerta.device?.deviceCode || ""}`.trim();
  }
  const quien = alerta.createdBy?.displayName || alerta.createdBy?.email;
  return quien ? `Reportó ${quien}` : "Desde la app";
}

interface Props {
  groupId?: string;
  soloAbiertas?: boolean;
  mostrarGrupo?: boolean;
  vacio: string;
  // Cambiarlo fuerza a recargar (p. ej. justo después de generar una alerta).
  version?: number;
}

export default function ListaAlertas({ groupId, soloAbiertas, mostrarGrupo, vacio, version }: Props) {
  const [alertas, setAlertas] = useState<Alerta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setAlertas(await listarAlertas({ groupId, soloAbiertas }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las alertas");
    }
  }, [groupId, soloAbiertas]);

  useEffect(() => {
    cargar();
  }, [cargar, version]);

  useEventoTiempoReal("alertas:cambio", ({ groupId: grupoDelCambio }) => {
    if (!groupId || groupId === grupoDelCambio) cargar();
  });
  useAlReconectar(cargar);

  useEffect(() => {
    const intervalo = setInterval(cargar, REFRESCO_MS);
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    const dejarDeEscuchar = escucharAlertasEnPrimerPlano(() => cargar());

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", alVolver);
      dejarDeEscuchar();
    };
  }, [cargar]);

  const cambiar = async (alerta: Alerta, accion: "atender" | "resolver") => {
    setCambiando(alerta.id);
    try {
      await cambiarEstadoAlerta(alerta.id, accion);
    } catch (e) {
      // Un 409 significa que alguien más ya la movió: basta con recargar.
      setError(e instanceof Error ? e.message : "No se pudo actualizar la alerta");
    } finally {
      await cargar();
      setCambiando(null);
    }
  };

  if (alertas === null) {
    return error ? (
      <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
    ) : (
      <p className="mt-1 text-sm text-slate-400">Cargando alertas…</p>
    );
  }

  return (
    <div className="mt-1 space-y-2">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {alertas.length === 0 && <p className="text-sm text-slate-400">{vacio}</p>}

      {alertas.map((alerta) => {
        const etiqueta = ETIQUETA_ESTADO[alerta.status];
        const ocupada = cambiando === alerta.id;
        return (
          <div
            key={alerta.id}
            className={`rounded-lg px-3 py-2 text-sm ring-1 ${
              alerta.status === "ACTIVE" ? "bg-red-50 ring-red-200" : "bg-slate-50 ring-slate-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                <span aria-hidden>{alerta.tipo.emoji}</span> {alerta.tipo.etiqueta}
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${etiqueta.clase}`}>
                {etiqueta.texto}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {mostrarGrupo ? `${alerta.group.name} · ` : ""}
              {origen(alerta)} · {new Date(alerta.createdAt).toLocaleString("es-MX")}
            </p>

            {alerta.status !== "RESOLVED" && (
              <div className="mt-2 flex gap-2">
                {alerta.status === "ACTIVE" && (
                  <button
                    onClick={() => cambiar(alerta, "atender")}
                    disabled={ocupada}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                  >
                    Ya voy / la estoy atendiendo
                  </button>
                )}
                <button
                  onClick={() => cambiar(alerta, "resolver")}
                  disabled={ocupada}
                  className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  Marcar resuelta
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
