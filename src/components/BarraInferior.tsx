import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import BotonPanico, { type EstadoSOS } from "./BotonPanico";
import { generarAlerta, obtenerPerfil, type Perfil } from "../services/api";

// La barra de 5 pestañas del diseño. El centro no es una pestaña más: es el
// botón de emergencia, el círculo oscuro que sobresale del resto.
//
// Desde aquí SE DISPARA la alerta, no se navega a otra pantalla. Antes había
// que entrar al grupo para llegar al botón; ahora está en todas las pantallas
// de la app, que es lo que importa cuando hay prisa.
//
// A quién le llega:
//   - si se está dentro de un grupo, a ese grupo;
//   - si solo hay uno, a ese;
//   - si hay varios, se pregunta — en una emergencia no se puede adivinar el
//     destinatario, y mandar el aviso a la casa equivocada es peor que tardar
//     un toque más.

const ICONO = "h-7 w-7";

function Persona({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={ICONO} fill={activo ? "currentColor" : "none"} stroke="currentColor" strokeWidth={activo ? 0 : 2} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function Burbuja({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={ICONO} fill={activo ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M12 3c5 0 9 3.4 9 7.5S17 18 12 18c-1 0-2-.1-2.9-.4L4 19.5l1.4-3.6C3.9 14.6 3 12.7 3 10.5 3 6.4 7 3 12 3Z" />
    </svg>
  );
}

// Ondas de señal: es el icono que el diseño usa para los dispositivos.
function Senal({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={ICONO} fill="none" stroke="currentColor" strokeWidth={activo ? 2.6 : 2} strokeLinecap="round" aria-hidden="true">
      <path d="M3 13a13 13 0 0 1 18 0" />
      <path d="M6.5 16.5a8 8 0 0 1 11 0" />
      <path d="M10 20a3.5 3.5 0 0 1 4 0" />
      <circle cx="12" cy="21" r="0.6" fill="currentColor" />
    </svg>
  );
}

function Engrane({ activo }: { activo: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={ICONO} fill="none" stroke="currentColor" strokeWidth={activo ? 2.6 : 2} aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}

const PESTANAS = [
  { a: "/perfil", etiqueta: "Perfil", Icono: Persona },
  { a: "/grupos", etiqueta: "Grupos", Icono: Burbuja },
  { a: "/dispositivos", etiqueta: "Dispositivos", Icono: Senal },
  { a: "/configuracion", etiqueta: "Configuración", Icono: Engrane },
];

interface Aviso {
  texto: string;
  tono: "ok" | "error" | "info";
  accion?: { a: string; etiqueta: string };
}

export default function BarraInferior() {
  const { pathname } = useLocation();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [estado, setEstado] = useState<EstadoSOS>("listo");
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const reinicio = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se pide una vez: de aquí salen si la cuenta puede alertar y a qué grupos
  // pertenece, que es todo lo que el botón necesita para decidir.
  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch(() => setPerfil(null));
  }, []);

  useEffect(
    () => () => {
      if (reinicio.current) clearTimeout(reinicio.current);
    },
    []
  );

  const grupos = perfil?.groups ?? [];
  // Mientras el perfil no llega no se bloquea: si se alcanza a mantener el
  // botón, manejarSOS lo explica en vez de tragarse el gesto.
  const bloqueado = perfil !== null && !perfil.accesoCompleto;

  const programarLimpieza = () => {
    if (reinicio.current) clearTimeout(reinicio.current);
    reinicio.current = setTimeout(() => {
      setEstado("listo");
      setAviso(null);
    }, 6000);
  };

  const disparar = async (groupId: string) => {
    setEligiendo(false);
    setAviso(null);
    setEstado("enviando");
    try {
      await generarAlerta(groupId, "GENERAL");
      navigator.vibrate?.([120, 60, 120]);
      const nombre = grupos.find((g) => g.id === groupId)?.name;
      setEstado("enviada");
      setAviso({
        tono: "ok",
        texto: nombre ? `Alerta enviada a ${nombre}.` : "Alerta enviada.",
        accion: { a: `/grupos/${groupId}`, etiqueta: "Abrir el grupo" },
      });
    } catch (e) {
      setEstado("listo");
      setAviso({
        tono: "error",
        texto: e instanceof Error ? e.message : "No se pudo enviar la alerta",
      });
    }
    programarLimpieza();
  };

  const manejarSOS = () => {
    // Dentro de un grupo el destinatario es obvio: ese.
    const enUnGrupo = pathname.startsWith("/grupos/") ? pathname.split("/")[2] : null;
    if (enUnGrupo) return disparar(enUnGrupo);

    if (!perfil) {
      setAviso({ tono: "info", texto: "Estamos leyendo tu cuenta. Intenta otra vez en un momento." });
      obtenerPerfil().then(setPerfil).catch(() => {});
      programarLimpieza();
      return;
    }
    if (grupos.length === 0) {
      setAviso({
        tono: "info",
        texto: "Todavía no estás en ningún grupo, así que no hay a quién avisarle.",
        accion: { a: "/grupos", etiqueta: "Crear o unirme a uno" },
      });
      programarLimpieza();
      return;
    }
    if (grupos.length === 1) return disparar(grupos[0].id);
    setEligiendo(true);
  };

  const explicarBloqueo = () => {
    setAviso({
      tono: "info",
      texto: "Tu cuenta no puede enviar alertas: primero captura el código de la caja de tu botón.",
      accion: { a: "/codigos", etiqueta: "Ir a Códigos" },
    });
    programarLimpieza();
  };

  const colorAviso = (tono: Aviso["tono"]) =>
    tono === "error" ? "var(--peligro)" : tono === "ok" ? "var(--texto)" : "var(--texto-tenue)";

  const izquierda = PESTANAS.slice(0, 2);
  const derecha = PESTANAS.slice(2);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t-2 px-2 pb-[env(safe-area-inset-bottom)] pt-2"
      style={{ background: "var(--fondo)", borderColor: "var(--borde)" }}
      aria-label="Navegación principal"
    >
      {/* Lo que el SOS tenga que decir sale aquí arriba, pegado al botón. */}
      {(eligiendo || aviso) && (
        <div className="absolute inset-x-0 bottom-full mb-2 px-3">
          <div className="tarjeta mx-auto max-w-lg p-3">
            {eligiendo ? (
              <>
                <p className="text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
                  ¿A qué grupo le aviso?
                </p>
                <ul className="mt-2 space-y-1.5">
                  {grupos.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => disparar(g.id)}
                        className="pieza w-full truncate px-4 py-2 text-left text-sm font-bold"
                        style={{ color: "var(--texto)" }}
                      >
                        {g.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setEligiendo(false)}
                  className="mt-2 w-full rounded-full py-1.5 text-xs font-bold uppercase"
                  style={{ background: "var(--fondo)", color: "var(--texto)" }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <p role="status" className="text-sm font-medium" style={{ color: colorAviso(aviso!.tono) }}>
                {aviso!.texto}{" "}
                {aviso!.accion && (
                  <Link
                    to={aviso!.accion.a}
                    onClick={() => setAviso(null)}
                    className="font-bold underline"
                    style={{ color: "var(--texto)" }}
                  >
                    {aviso!.accion.etiqueta}
                  </Link>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {izquierda.map(({ a, etiqueta, Icono }) => (
        <NavLink key={a} to={a} aria-label={etiqueta} className="p-2">
          {({ isActive }) => (
            <span style={{ color: isActive ? "var(--texto)" : "var(--texto-tenue)" }}>
              <Icono activo={isActive} />
            </span>
          )}
        </NavLink>
      ))}

      <BotonPanico
        estado={estado}
        alMantener={manejarSOS}
        bloqueado={bloqueado}
        alToqueBloqueado={explicarBloqueo}
      />

      {derecha.map(({ a, etiqueta, Icono }) => (
        <NavLink key={a} to={a} aria-label={etiqueta} className="p-2">
          {({ isActive }) => (
            <span style={{ color: isActive ? "var(--texto)" : "var(--texto-tenue)" }}>
              <Icono activo={isActive} />
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
