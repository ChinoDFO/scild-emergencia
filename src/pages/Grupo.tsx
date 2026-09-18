import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import BotonAlerta from "../components/BotonAlerta";
import Chat from "../components/Chat";
import InfoGrupo from "../components/InfoGrupo";
import ListaAlertas from "../components/ListaAlertas";
import { obtenerGrupo, type DetalleGrupo } from "../services/api";
import { entrarASalaDeGrupo, useEventoTiempoReal } from "../services/tiempoReal";

const PESTANAS = [
  { id: "alertas", texto: "Alertas" },
  { id: "chat", texto: "Chat" },
  { id: "info", texto: "Info" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

export default function Grupo() {
  const { id = "" } = useParams();
  // La pestaña va en la URL (?tab=chat) para poder enlazar directo a ella.
  const [parametros, setParametros] = useSearchParams();
  const pestana: Pestana = PESTANAS.some((p) => p.id === parametros.get("tab"))
    ? (parametros.get("tab") as Pestana)
    : "alertas";

  const [grupo, setGrupo] = useState<DetalleGrupo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versionAlertas, setVersionAlertas] = useState(0);

  const cargar = useCallback(() => {
    obtenerGrupo(id)
      .then(setGrupo)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(cargar, [cargar]);

  // Por si se unió al grupo después de abrir la conexión en tiempo real.
  useEffect(() => entrarASalaDeGrupo(id), [id]);

  // Otro miembro editó el grupo o alguien nuevo se unió.
  useEventoTiempoReal("grupo:actualizado", ({ groupId }) => {
    if (groupId === id) cargar();
  });

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-red-600">
          ← Volver
        </Link>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {!grupo && !error && <p className="mt-4 text-sm text-slate-400">Cargando…</p>}

        {grupo && (
          <>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{grupo.name}</h1>
                {grupo.address && <p className="mt-0.5 text-sm text-slate-500">{grupo.address}</p>}
              </div>
              <span className="text-xs uppercase text-slate-400">{grupo.role}</span>
            </div>

            <div className="mt-5">
              <BotonAlerta
                groupId={grupo.id}
                groupName={grupo.name}
                alEnviar={() => {
                  setVersionAlertas((v) => v + 1);
                  setParametros({ tab: "alertas" }, { replace: true });
                }}
              />
            </div>

            <nav className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1" aria-label="Secciones del grupo">
              {PESTANAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setParametros({ tab: p.id }, { replace: true })}
                  aria-current={pestana === p.id ? "page" : undefined}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
                    pestana === p.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  {p.texto}
                </button>
              ))}
            </nav>

            <div className="mt-4">
              {pestana === "alertas" && (
                <ListaAlertas groupId={grupo.id} vacio="Este grupo no tiene alertas." version={versionAlertas} />
              )}
              {pestana === "chat" && <Chat groupId={grupo.id} myUserId={grupo.myUserId} />}
              {pestana === "info" && <InfoGrupo grupo={grupo} alCambiar={cargar} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
