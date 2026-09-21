import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import ListaAlertas from "../components/ListaAlertas";
import Apodo from "../components/Apodo";
import { obtenerAcceso, obtenerPerfil, type Acceso, type Perfil as DatosPerfil } from "../services/api";

// El perfil del diseño: avatar con "Editar", el apodo, un bloque punteado con
// los cuatro datos de la cuenta y abajo el historial de alertas.
//
// La "ubicación de sus botones" es la del establecimiento donde está vinculado
// cada uno: el aparato no guarda una propia (ver la pantalla del botón).

function fecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Perfil() {
  const [perfil, setPerfil] = useState<DatosPerfil | null>(null);
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    Promise.all([obtenerPerfil(), obtenerAcceso()])
      .then(([p, a]) => {
        setPerfil(p);
        setAcceso(a);
      })
      .catch((e) => setError(e.message));
  }, []);

  const ubicaciones = (acceso?.botones ?? [])
    .map((b) => b.grupo?.name)
    .filter((v): v is string => Boolean(v));

  const inicial = (perfil?.displayName || perfil?.email || "?").slice(0, 1).toUpperCase();

  return (
    <Pantalla titulo="Perfil">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex flex-col items-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-black"
            style={{ background: "var(--avatar)", color: "var(--fondo)" }}
            aria-hidden="true"
          >
            {inicial}
          </div>
          <button
            onClick={() => setEditando((v) => !v)}
            className="mt-1 text-xs font-bold"
            style={{ color: "var(--texto)" }}
          >
            Editar
          </button>
        </div>
        <div className="min-w-0 flex-1 border-b-2 pb-1" style={{ borderColor: "var(--borde-tenue)" }}>
          <p className="truncate text-2xl font-extrabold" style={{ color: "var(--texto)" }}>
            {perfil?.displayName || "Sin apodo"}
          </p>
        </div>
      </div>

      {editando && (
        <div className="mb-4">
          <Apodo
            apodo={perfil?.displayName ?? null}
            alCambiar={(nuevo) => {
              setPerfil((p) => (p ? { ...p, displayName: nuevo } : p));
              setEditando(false);
            }}
          />
        </div>
      )}

      {error && (
        <p
          className="mb-3 rounded-xl px-3 py-2 text-sm"
          style={{ background: "var(--superficie)", color: "var(--peligro)" }}
        >
          No se pudo cargar tu perfil: {error}
        </p>
      )}

      <div className="punteado mb-6 rounded-3xl p-5" style={{ background: "var(--superficie)" }}>
        <ul className="space-y-2 text-sm font-bold" style={{ color: "var(--texto)" }}>
          <li className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Correo</span>
            <span className="font-normal">{perfil?.email ?? "—"}</span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Cantidad de botones vinculados</span>
            <span className="font-normal">{acceso?.botones.length ?? "—"}</span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Fecha de creación de cuenta</span>
            <span className="font-normal">{fecha(perfil?.creadaEl)}</span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Ubicación actual de sus botones</span>
            <span className="font-normal">
              {ubicaciones.length > 0 ? ubicaciones.join(", ") : "Sin botón en un grupo"}
            </span>
          </li>
        </ul>
      </div>

      {/* Códigos y el pago viven aquí: es donde el diseño ya habla de los
          botones vinculados a la cuenta. */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          to="/codigos"
          className="pieza py-2.5 text-center text-sm font-bold"
          style={{ color: "var(--texto)" }}
        >
          Códigos
        </Link>
        <Link
          to="/ayuda"
          className="pieza py-2.5 text-center text-sm font-bold"
          style={{ color: "var(--texto)" }}
        >
          Ayuda
        </Link>
      </div>

      <h2 className="titulo-pantalla mb-2 text-center text-lg">Historial de alertas</h2>
      <div className="punteado rounded-3xl p-3" style={{ background: "var(--superficie)" }}>
        <ListaAlertas mostrarGrupo vacio="Todavía no hay alertas en tus grupos." />
      </div>
    </Pantalla>
  );
}
