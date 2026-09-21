import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import BarraBusqueda from "../components/BarraBusqueda";
import GestionGrupos from "../components/GestionGrupos";
import { obtenerPerfil, type Perfil } from "../services/api";

// "SCILD CONTROL" del diseño: el buscador, la lista de grupos con su avatar y
// el contador de notificaciones nuevas, y el "+" para crear o unirse.

export default function Grupos() {
  const navigate = useNavigate();
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
    const todos = perfil?.groups ?? [];
    return q ? todos.filter((g) => g.name.toLowerCase().includes(q)) : todos;
  }, [perfil, busqueda]);

  return (
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
          <li key={g.id}>
            <button
              onClick={() => navigate(`/grupos/${g.id}`)}
              className="tarjeta flex w-full items-center gap-3 px-3 py-3 text-left"
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
  );
}
