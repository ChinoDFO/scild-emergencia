import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import BarraBusqueda from "../components/BarraBusqueda";
import GestionGrupos from "../components/GestionGrupos";
import GuiaBienvenida, { guiaYaVista, marcarGuiaVista } from "../components/GuiaBienvenida";
import { useAuth } from "../context/AuthContext";
import { fijarGrupo, obtenerPerfil, type Grupo, type Perfil } from "../services/api";
import { useEventoTiempoReal } from "../services/tiempoReal";

// "SCILD CONTROL" del diseño: el buscador, la lista de grupos con su avatar y
// el contador de notificaciones nuevas, y el "+" para crear o unirse.
//
// El orden de la lista no es fijo: arriba los grupos fijados y después los
// que tienen conversación más reciente, como cualquier app de mensajes. Con
// varios grupos, el que está hablando ahora es el que importa.

// Chincheta de "fijar grupo": rellena cuando ya lo está.
function Chincheta({ fijado }: { fijado: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={fijado ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.5 3h5l-.8 5.2 3.3 3.1V13H7v-1.7l3.3-3.1L9.5 3Z" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  );
}

// El mismo orden que manda el backend. Se repite aquí porque la lista se
// reacomoda sola —al fijar un grupo o cuando entra un mensaje por el
// socket— sin volver a pedir el perfil.
function ordenar(grupos: Grupo[]) {
  const fecha = (v: string | null) => (v ? Date.parse(v) : 0);
  return [...grupos].sort((a, b) => {
    if (a.fijado !== b.fijado) return a.fijado ? -1 : 1;
    if (a.fijado && b.fijado) return fecha(b.fijadoEl) - fecha(a.fijadoEl);
    return fecha(b.ultimoMensajeEl) - fecha(a.ultimoMensajeEl);
  });
}

export default function Grupos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  // La guía se abre sola la primera vez que esta cuenta entra.
  const [guia, setGuia] = useState(() => Boolean(usuario) && !guiaYaVista(usuario!.uid));
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch((e) => setError(e.message));
  }, []);

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const todos = ordenar(perfil?.groups ?? []);
    return q ? todos.filter((g) => g.name.toLowerCase().includes(q)) : todos;
  }, [perfil, busqueda]);

  // Cambia un grupo de la lista sin volver a pedir el perfil entero.
  const cambiarGrupo = (id: string, cambio: (g: Grupo) => Grupo) =>
    setPerfil((p) => (p ? { ...p, groups: p.groups.map((g) => (g.id === id ? cambio(g) : g)) } : p));

  // El socket recibe los mensajes de TODOS sus grupos, no solo del abierto:
  // así el grupo que acaba de escribir sube al momento, sin recargar.
  useEventoTiempoReal("mensaje:nuevo", (m) => {
    cambiarGrupo(m.groupId, (g) => ({ ...g, ultimoMensajeEl: m.createdAt }));
  });

  // Optimista: la chincheta y el salto en la lista tienen que sentirse al
  // instante. Si el backend falla, el grupo vuelve a como estaba.
  const alternarFijado = async (grupo: Grupo) => {
    const fijado = !grupo.fijado;
    cambiarGrupo(grupo.id, (g) => ({
      ...g,
      fijado,
      fijadoEl: fijado ? new Date().toISOString() : null,
    }));
    try {
      await fijarGrupo(grupo.id, fijado);
      setError(null);
    } catch (e) {
      cambiarGrupo(grupo.id, () => grupo);
      setError(e instanceof Error ? e.message : "No se pudo fijar el grupo");
    }
  };

  const cerrarGuia = () => {
    if (usuario) marcarGuiaVista(usuario.uid);
    setGuia(false);
  };

  return (
    <>
    {guia && <GuiaBienvenida alCerrar={cerrarGuia} />}
    <Pantalla
      titulo="SCILD Control"
      accion={{ etiqueta: "Crear o unirse a un grupo", alTocar: () => setCreando((v) => !v) }}
    >
      <BarraBusqueda valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar grupo" />

      {creando && (
        <div className="tarjeta mb-3 p-4">
          <GestionGrupos />
        </div>
      )}

      {error && (
        <p
          className="mb-3 rounded-xl px-3 py-2 text-sm"
          style={{ background: "var(--superficie)", color: "var(--peligro)" }}
        >
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {grupos.map((g) => (
          <li key={g.id} className="tarjeta flex items-center">
            <button
              onClick={() => navigate(`/grupos/${g.id}`)}
              className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-1 text-left"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black"
                style={{ background: "var(--avatar)", color: "var(--fondo)" }}
                aria-hidden="true"
              >
                {g.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold uppercase" style={{ color: "var(--texto)" }}>
                  {g.name}
                </span>
                <span className="text-[11px] uppercase" style={{ color: "var(--texto-tenue)" }}>
                  {g.role === "ADMIN" ? "Administras este grupo" : "Miembro"}
                </span>
              </span>
              {g.sinLeer > 0 && (
                <span className="shrink-0 text-right">
                  <span
                    className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold"
                    style={{ borderColor: "var(--borde)", color: "var(--texto)" }}
                  >
                    {g.sinLeer > 99 ? "99+" : g.sinLeer}
                  </span>
                  <span className="mt-0.5 block text-[9px] font-bold leading-tight" style={{ color: "var(--texto)" }}>
                    Notificaciones
                    <br />
                    nuevas
                  </span>
                </span>
              )}
            </button>
            <button
              onClick={() => alternarFijado(g)}
              aria-pressed={g.fijado}
              aria-label={g.fijado ? `Soltar ${g.name}` : `Fijar ${g.name} arriba`}
              title={g.fijado ? "Soltar" : "Fijar arriba"}
              className="flex h-12 w-12 shrink-0 items-center justify-center"
              style={{ color: g.fijado ? "var(--texto)" : "var(--texto-tenue)" }}
            >
              <Chincheta fijado={g.fijado} />
            </button>
          </li>
        ))}
      </ul>

      {perfil && grupos.length === 0 && (
        <p className="mt-6 text-center text-sm" style={{ color: "var(--texto-tenue)" }}>
          {busqueda
            ? "Ningún grupo con ese nombre."
            : "Todavía no estás en ningún grupo. Usa el + para crear uno o entrar con un código."}
        </p>
      )}
    </Pantalla>
    </>
  );
}
