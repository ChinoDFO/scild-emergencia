import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BotonPanico from "../components/BotonPanico";
import Conversacion from "../components/Conversacion";
import InfoGrupo from "../components/InfoGrupo";
import { useAlertas } from "../hooks/useAlertas";
import { obtenerGrupo, type DetalleGrupo } from "../services/api";
import { origen } from "../services/formatoAlertas";
import {
  avisarGrupoAbierto,
  entrarASalaDeGrupo,
  useConexionTiempoReal,
  useEventoTiempoReal,
} from "../services/tiempoReal";

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// Pantalla única del grupo, al estilo de una app de mensajería:
//   encabezado (nombre y miembros; al tocarlo abre la info del grupo)
//   botón SOS inmediato
//   alertas abiertas fijas (para atenderlas sin buscarlas)
//   conversación: mensajes + alertas en una sola línea de tiempo
//   caja de mensaje con el botón "!" que abre el menú de tipos de alerta
export default function Grupo() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState<DetalleGrupo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoAbierta, setInfoAbierta] = useState(false);
  const conectado = useConexionTiempoReal();
  const { alertas, cargar: recargarAlertas, cambiar, cambiando } = useAlertas({ groupId: id });
  const [parametros, setParametros] = useSearchParams();

  const cargar = useCallback(() => {
    obtenerGrupo(id)
      .then(setGrupo)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(cargar, [cargar]);

  // Por si se unió al grupo después de abrir la conexión en tiempo real.
  useEffect(() => entrarASalaDeGrupo(id), [id]);

  // Mientras esta pantalla esté abierta, el backend no manda push de los
  // mensajes de este grupo: ya se están viendo.
  useEffect(() => avisarGrupoAbierto(id), [id]);

  // Llega del botón "Ya voy" de la notificación: el service worker no puede
  // llamar a la API (no tiene la sesión de la persona), así que abre la app
  // con la alerta en la dirección y se atiende aquí. El parámetro se limpia
  // de inmediato para que recargar la página no vuelva a dispararlo.
  const porAtender = parametros.get("atender");
  useEffect(() => {
    if (!porAtender || !alertas) return;
    setParametros({}, { replace: true });
    const alerta = alertas.find((a) => a.id === porAtender);
    if (alerta?.status === "ACTIVE") cambiar(alerta, "atender");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porAtender, alertas]);

  // Alguien con permiso eliminó el grupo (o fue el último en salirse).
  useEventoTiempoReal("grupo:eliminado", ({ groupId }) => {
    if (groupId === id) navigate("/", { replace: true });
  });

  // Otro miembro editó el grupo o alguien nuevo se unió.
  useEventoTiempoReal("grupo:actualizado", ({ groupId }) => {
    if (groupId === id) cargar();
  });

  useEffect(() => {
    if (!infoAbierta) return;
    const conEscape = (e: KeyboardEvent) => e.key === "Escape" && setInfoAbierta(false);
    window.addEventListener("keydown", conEscape);
    return () => window.removeEventListener("keydown", conEscape);
  }, [infoAbierta]);

  if (!grupo) {
    return (
      <div className="flex h-svh items-center justify-center bg-slate-100 px-6 text-center">
        {error ? (
          <div>
            <p className="text-sm text-red-700">{error}</p>
            <Link to="/" className="mt-3 inline-block text-sm font-medium text-slate-600 underline">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Cargando…</p>
        )}
      </div>
    );
  }

  const nombresMiembros = grupo.members
    .map((m) => (m.userId === grupo.myUserId ? "Tú" : m.displayName || m.email.split("@")[0]))
    .join(", ");
  const abiertas = (alertas ?? []).filter((a) => a.status !== "RESOLVED");

  return (
    <div className="flex h-svh justify-center bg-slate-300">
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-slate-100 shadow-xl">
        {/* --- Encabezado --- */}
        <header className="flex items-center gap-2 bg-slate-900 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-white">
          <Link to="/" aria-label="Volver" className="rounded-full p-2 hover:bg-white/10">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <button
            onClick={() => setInfoAbierta(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pr-2 text-left hover:bg-white/5"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold">
              {iniciales(grupo.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{grupo.name}</span>
              <span className={`block truncate text-xs ${conectado ? "text-slate-300" : "text-amber-300"}`}>
                {conectado ? nombresMiembros : "Conectando…"}
              </span>
            </span>
          </button>
          <button
            onClick={() => setInfoAbierta(true)}
            aria-label="Info del grupo"
            className="rounded-full p-2 text-slate-300 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </header>

        {/* --- Emergencia --- */}
        <section className="border-b border-slate-200 bg-white" aria-label="Emergencia">
          {grupo.puedoAlertar ? (
            <BotonPanico groupId={grupo.id} alEnviar={recargarAlertas} />
          ) : (
            // Sin el permiso no se esconde y ya: quien no ve el botón SOS
            // tiene que entender por qué, o va a creer que la app falla justo
            // cuando más la necesita.
            <p className="px-5 py-3 text-center text-xs leading-relaxed text-slate-500">
              Aquí recibes las alertas del grupo y participas en el chat. Para poder{" "}
              <span className="font-medium text-slate-600">enviarlas</span>, vincula tu botón
              desde la info del grupo o pídele al administrador que te habilite.
            </p>
          )}

          {abiertas.length > 0 && (
            <ul className="max-h-36 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Alertas abiertas">
              {abiertas.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    a.status === "ACTIVE" ? "bg-red-600 text-white" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {a.tipo.emoji} {a.tipo.etiqueta}
                      {a.status === "ACKNOWLEDGED" && " · atendiendo"}
                    </span>
                    <span className={`block truncate text-xs ${a.status === "ACTIVE" ? "text-red-100" : "text-amber-800"}`}>
                      {origen(a)} · {new Date(a.createdAt).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </span>
                  {a.status === "ACTIVE" && (
                    <button
                      onClick={() => cambiar(a, "atender")}
                      disabled={cambiando === a.id}
                      className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                    >
                      Ya voy
                    </button>
                  )}
                  <button
                    onClick={() => cambiar(a, "resolver")}
                    disabled={cambiando === a.id}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-60 ${
                      a.status === "ACTIVE" ? "bg-red-800 text-white" : "bg-white text-amber-900"
                    }`}
                  >
                    Resuelta
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Conversación --- */}
        <Conversacion
          groupId={grupo.id}
          groupName={grupo.name}
          myUserId={grupo.myUserId}
          puedoAlertar={grupo.puedoAlertar}
          alertas={alertas ?? []}
          alEnviarAlerta={recargarAlertas}
        />

        {/* --- Info del grupo (se abre desde el encabezado) --- */}
        {infoAbierta && (
          <div className="absolute inset-0 z-30 flex flex-col bg-white" role="dialog" aria-label="Info del grupo">
            <header className="flex items-center gap-2 bg-slate-900 px-2 py-3 text-white">
              <button onClick={() => setInfoAbierta(false)} aria-label="Cerrar" className="rounded-full p-2 hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="font-semibold">Info del grupo</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <InfoGrupo grupo={grupo} alCambiar={cargar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
