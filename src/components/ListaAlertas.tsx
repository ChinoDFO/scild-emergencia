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
      <p className="mt-1 text-sm font-bold" style={{ color: "var(--peligro)" }}>
        {error}
      </p>
    ) : (
      <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
        Cargando alertas…
      </p>
    );
  }

  return (
    <div className="mt-1 space-y-2">
      {error && (
        <p className="text-sm font-bold" style={{ color: "var(--peligro)" }}>
          {error}
        </p>
      )}

      {alertas.length === 0 && (
        <p className="text-sm" style={{ color: "var(--texto-tenue)" }}>
          {vacio}
        </p>
      )}

      {alertas.map((alerta) => {
        const etiqueta = ETIQUETA_ESTADO[alerta.status];
        const ocupada = cambiando === alerta.id;
        const activa = alerta.status === "ACTIVE";
        return (
          <div
            key={alerta.id}
            className="tarjeta px-3 py-2.5 text-sm"
            style={{ borderColor: activa ? "var(--peligro)" : "var(--borde)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold uppercase" style={{ color: "var(--texto)" }}>
                <span aria-hidden>{alerta.tipo.emoji}</span> {alerta.tipo.etiqueta}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                style={{ background: etiqueta.fondo, color: etiqueta.color }}
              >
                {etiqueta.texto}
              </span>
            </div>
            <p className="mt-0.5 text-xs" style={{ color: "var(--texto-tenue)" }}>
              {mostrarGrupo ? `${alerta.group.name} · ` : ""}
              {origen(alerta)} · {new Date(alerta.createdAt).toLocaleString("es-MX")}
            </p>

            {alerta.status !== "RESOLVED" && (
              <div className="mt-2 flex gap-2">
                {activa && (
                  <button
                    onClick={() => cambiar(alerta, "atender")}
                    disabled={ocupada}
                    className="rounded-full px-3 py-1.5 text-xs font-bold uppercase disabled:opacity-50"
                    style={{ background: "var(--texto)", color: "var(--fondo)" }}
                  >
                    Ya voy
                  </button>
                )}
                <button
                  onClick={() => cambiar(alerta, "resolver")}
                  disabled={ocupada}
                  className="rounded-full border-2 px-3 py-1.5 text-xs font-bold uppercase disabled:opacity-50"
                  style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
                >
                  Resuelta
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
