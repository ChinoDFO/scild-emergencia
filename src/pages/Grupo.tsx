import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
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

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

// Pantalla única del grupo, con el mismo lenguaje del resto de la app: fondo
// claro, trazo negro grueso y títulos en mayúsculas.
//
//   encabezado (nombre y miembros; al tocarlo abre la info del grupo)
//   alertas abiertas fijas (para atenderlas sin buscarlas)
//   conversación: mensajes + alertas en una sola línea de tiempo
//   caja de mensaje con el botón amarillo "!" de alertas por tipo
//
// Ya NO trae el círculo rojo de emergencia: el SOS vive en la barra de abajo
// (ver BarraInferior), a la mano desde cualquier pantalla y sin tener que
// entrar al grupo. Aquí queda el "!" amarillo, que es otra cosa: elegir QUÉ
// está pasando. Por eso son distintos a propósito — círculo oscuro abajo,
// cuadrado amarillo en el chat.
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
      <div
        className="flex h-svh items-center justify-center px-6 text-center"
        style={{ background: "var(--fondo)" }}
      >
        {error ? (
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--peligro)" }}>
              {error}
            </p>
            <Link
              to="/"
              className="mt-3 inline-block text-xs font-bold uppercase underline"
              style={{ color: "var(--texto)" }}
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--texto-tenue)" }}>
            Cargando…
          </p>
        )}
      </div>
    );
  }

  const nombresMiembros = grupo.members
    .map((m) => (m.userId === grupo.myUserId ? "Tú" : m.displayName || m.email.split("@")[0]))
    .join(", ");
  const abiertas = (alertas ?? []).filter((a) => a.status !== "RESOLVED");

  const botonIcono = "rounded-full p-2 transition active:scale-95";

  return (
    <div className="flex h-svh justify-center" style={{ background: "var(--superficie-suave)" }}>
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden"
        style={{ background: "var(--fondo)" }}
      >
        {/* --- Encabezado --- */}
        <header
          className="flex items-center gap-1 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
          style={{ background: "var(--fondo)", borderBottom: "2px solid var(--borde)" }}
        >
          <Link to="/" aria-label="Volver" className={botonIcono} style={{ color: "var(--texto)" }}>
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <button
            onClick={() => setInfoAbierta(true)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{ background: "var(--avatar)", color: "var(--fondo)", border: "2px solid var(--borde)" }}
            >
              {iniciales(grupo.name)}
            </span>
            <span className="min-w-0">
              <span className="titulo-pantalla block truncate text-base leading-tight">{grupo.name}</span>
              <span
                className="block truncate text-[11px]"
                style={{ color: conectado ? "var(--texto-tenue)" : "var(--peligro)" }}
              >
                {conectado ? nombresMiembros : "Conectando…"}
              </span>
            </span>
          </button>

          <button
            onClick={() => setInfoAbierta(true)}
            aria-label="Info del grupo"
            className={botonIcono}
            style={{ color: "var(--texto)" }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </header>

        {/* Quien no puede alertar tiene que saber por qué: si no, va a creer
            que la app le falla justo cuando más la necesita. */}
        {!grupo.puedoAlertar && (
          <p
            className="px-4 py-2 text-[11px] leading-relaxed"
            style={{
              background: "var(--superficie-suave)",
              color: "var(--texto-tenue)",
              borderBottom: "2px solid var(--borde-tenue)",
            }}
          >
            Aquí recibes las alertas del grupo y participas en el chat. Para poder{" "}
            <span className="font-bold" style={{ color: "var(--texto)" }}>
              enviarlas
            </span>{" "}
            captura el código de la caja de tu botón en Códigos.
          </p>
        )}

        {/* --- Alertas abiertas, fijas para poder atenderlas --- */}
        {abiertas.length > 0 && (
          <ul className="max-h-36 space-y-2 overflow-y-auto p-3" aria-label="Alertas abiertas">
            {abiertas.map((a) => {
              const activa = a.status === "ACTIVE";
              return (
                <li
                  key={a.id}
                  className="tarjeta p-3"
                  style={{ borderColor: activa ? "var(--peligro)" : "var(--borde)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
                        <span aria-hidden>{a.tipo.emoji}</span> {a.tipo.etiqueta}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: "var(--texto-tenue)" }}>
                        {origen(a)} · {hora(a.createdAt)}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                      style={{
                        background: activa ? "var(--peligro)" : "var(--alerta)",
                        color: activa ? "var(--fondo)" : "var(--alerta-texto)",
                      }}
                    >
                      {activa ? "Activa" : "Atendiendo"}
                    </span>
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    {activa && (
                      <button
                        onClick={() => cambiar(a, "atender")}
                        disabled={cambiando === a.id}
                        className="flex-1 rounded-full py-1.5 text-xs font-bold uppercase disabled:opacity-50"
                        style={{ background: "var(--texto)", color: "var(--fondo)" }}
                      >
                        Ya voy
                      </button>
                    )}
                    <button
                      onClick={() => cambiar(a, "resolver")}
                      disabled={cambiando === a.id}
                      className="flex-1 rounded-full border-2 py-1.5 text-xs font-bold uppercase disabled:opacity-50"
                      style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
                    >
                      Resuelta
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

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
          <div
            className="absolute inset-0 z-30 flex flex-col"
            style={{ background: "var(--fondo)" }}
            role="dialog"
            aria-label="Info del grupo"
          >
            <header
              className="flex items-center gap-1 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
              style={{ borderBottom: "2px solid var(--borde)" }}
            >
              <button
                onClick={() => setInfoAbierta(false)}
                aria-label="Cerrar"
                className={botonIcono}
                style={{ color: "var(--texto)" }}
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="titulo-pantalla text-lg">Info del grupo</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <InfoGrupo grupo={grupo} alCambiar={cargar} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
