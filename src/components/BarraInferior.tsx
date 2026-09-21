import { NavLink, useLocation, useNavigate } from "react-router-dom";

// La barra de 5 pestañas del diseño. El centro no es una pestaña más: es el
// botón de emergencia, dibujado como círculo oscuro sobresaliendo del resto.
//
// Lleva a la pantalla desde donde se dispara la alerta. Si la persona está
// dentro de un grupo, ahí mismo; si no, a la lista para que elija a quién
// avisar — en una emergencia no se puede adivinar el destinatario.

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

export default function BarraInferior() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enUnGrupo = pathname.startsWith("/grupos/");

  const irAEmergencia = () => {
    // Dentro de un grupo el SOS ya está en pantalla; desde fuera hay que
    // elegir grupo primero.
    if (!enUnGrupo) navigate("/grupos");
  };

  const izquierda = PESTANAS.slice(0, 2);
  const derecha = PESTANAS.slice(2);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 pb-[env(safe-area-inset-bottom)] pt-2"
      style={{ background: "var(--fondo)", borderColor: "var(--borde-tenue)" }}
      aria-label="Navegación principal"
    >
      {izquierda.map(({ a, etiqueta, Icono }) => (
        <NavLink key={a} to={a} aria-label={etiqueta} className="p-2">
          {({ isActive }) => (
            <span style={{ color: isActive ? "var(--texto)" : "var(--texto-tenue)" }}>
              <Icono activo={isActive} />
            </span>
          )}
        </NavLink>
      ))}

      <button
        type="button"
        onClick={irAEmergencia}
        aria-label="Botón de emergencia"
        className="-mt-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black shadow-lg transition active:scale-95"
        style={{
          background: "var(--emergencia)",
          color: "var(--fondo)",
          border: "3px solid var(--borde)",
          boxShadow: "0 4px 12px var(--sombra)",
        }}
      >
        !
      </button>

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
