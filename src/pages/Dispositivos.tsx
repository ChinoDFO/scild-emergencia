import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import BarraBusqueda from "../components/BarraBusqueda";
import { obtenerAcceso, type Acceso } from "../services/api";

// "LISTA DE DISPOSITIVOS" del diseño. El "+" no da de alta un aparato —eso se
// hace de fábrica— sino que lleva a Códigos a capturar el código de la caja,
// que es como una persona suma un botón a su cuenta.
//
// Arriba va el resumen: cuántos botones hay y cuántos están bien. Con uno o
// dos se ve en la lista, pero con quince —un coto entero— lo que importa
// primero es si hay alguno caído, no el nombre de cada uno.

const ETIQUETA_ESTADO: Record<string, string> = {
  ONLINE: "En línea",
  IRREGULAR: "Señal irregular",
  OFFLINE: "Sin conexión",
  EMERGENCY: "Emergencia",
  MAINTENANCE: "Mantenimiento",
};

// Un botón "bien" es el que reportó a tiempo. IRREGULAR y OFFLINE no son lo
// mismo y por eso se cuentan aparte: el primero todavía responde pero llega
// tarde (WiFi flojo), el segundo ya no da señales.
function Contador({
  etiqueta,
  valor,
  color,
}: {
  etiqueta: string;
  valor: number;
  color: string;
}) {
  return (
    <div
      className="trazo flex flex-col items-center justify-center rounded-2xl px-2 py-3"
      style={{ background: "var(--fondo)" }}
    >
      <span className="text-2xl font-black leading-none" style={{ color }}>
        {valor}
      </span>
      <span
        className="mt-1 text-center text-[10px] font-bold uppercase leading-tight"
        style={{ color: "var(--texto-tenue)" }}
      >
        {etiqueta}
      </span>
    </div>
  );
}

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

  // El resumen cuenta TODOS los botones de la cuenta, no los que dejó la
  // búsqueda: es el estado general, no el de lo que se está filtrando.
  const todos = acceso?.botones ?? [];
  const cuantos = (estado: string) => todos.filter((b) => b.estado === estado).length;

  return (
    <Pantalla
      titulo="Lista de dispositivos"
      subtitulo="Monitorea el estado de tus dispositivos"
      accion={{ etiqueta: "Vincular un botón", alTocar: () => navigate("/codigos") }}
    >
      {todos.length > 0 && (
        <div className="tarjeta mb-3 grid grid-cols-4 gap-2 p-3">
          <Contador etiqueta="Botones" valor={todos.length} color="var(--texto)" />
          <Contador etiqueta="En línea" valor={cuantos("ONLINE")} color="var(--texto)" />
          <Contador etiqueta="Irregular" valor={cuantos("IRREGULAR")} color="var(--alerta)" />
          <Contador
            etiqueta="Sin señal"
            valor={cuantos("OFFLINE") + cuantos("MAINTENANCE")}
            color="var(--peligro)"
          />
        </div>
      )}

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
