import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import BarraBusqueda from "../components/BarraBusqueda";
import { obtenerAcceso, type Acceso } from "../services/api";

// "LISTA DE DISPOSITIVOS" del diseño. El "+" no da de alta un aparato —eso se
// hace de fábrica— sino que lleva a Códigos a capturar el código de la caja,
// que es como una persona suma un botón a su cuenta.

const ETIQUETA_ESTADO: Record<string, string> = {
  ONLINE: "En línea",
  IRREGULAR: "Señal irregular",
  OFFLINE: "Sin conexión",
  EMERGENCY: "Emergencia",
  MAINTENANCE: "Mantenimiento",
};

export default function Dispositivos() {
  const navigate = useNavigate();
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAcceso()
      .then(setAcceso)
      .catch((e) => setError(e.message));
  }, []);

  const botones = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const todos = acceso?.botones ?? [];
    return q
      ? todos.filter(
          (b) => b.nombre.toLowerCase().includes(q) || b.deviceCode.toLowerCase().includes(q)
        )
      : todos;
  }, [acceso, busqueda]);

  return (
    <Pantalla
      titulo="Lista de dispositivos"
      subtitulo="Monitorea el estado de tus dispositivos"
      accion={{ etiqueta: "Vincular un botón", alTocar: () => navigate("/codigos") }}
    >
      <BarraBusqueda valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar botón" />

      {error && (
        <p
          className="mb-3 rounded-xl px-3 py-2 text-sm"
          style={{ background: "var(--superficie)", color: "var(--peligro)" }}
        >
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {botones.map((b) => (
          <li key={b.id}>
            <button
              onClick={() => navigate(`/dispositivos/${b.id}`)}
              className="tarjeta flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--avatar)" }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="var(--fondo)" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M4 13a12 12 0 0 1 16 0" />
                  <path d="M7.5 16.5a7 7 0 0 1 9 0" />
                  <circle cx="12" cy="20" r="1.2" fill="var(--fondo)" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold uppercase" style={{ color: "var(--texto)" }}>
                  {b.nombre}
                </span>
                <span className="text-[11px]" style={{ color: "var(--texto-tenue)" }}>
                  {ETIQUETA_ESTADO[b.estado] ?? b.estado} ·{" "}
                  {b.grupo ? b.grupo.name : "Sin grupo"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {acceso && botones.length === 0 && (
        <p className="mt-6 text-center text-sm" style={{ color: "var(--texto-tenue)" }}>
          {busqueda
            ? "Ningún botón con ese nombre."
            : "Tu cuenta no tiene botones vinculados. Captura el código de la caja con el +."}
        </p>
      )}
    </Pantalla>
  );
}
