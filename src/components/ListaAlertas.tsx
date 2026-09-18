import { useAlertas } from "../hooks/useAlertas";
import { ETIQUETA_ESTADO, origen } from "../services/formatoAlertas";

interface Props {
  groupId?: string;
  soloAbiertas?: boolean;
  mostrarGrupo?: boolean;
  vacio: string;
}

export default function ListaAlertas({ groupId, soloAbiertas, mostrarGrupo, vacio }: Props) {
  const { alertas, error, cambiar, cambiando } = useAlertas({ groupId, soloAbiertas });

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
