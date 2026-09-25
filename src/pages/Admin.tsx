import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AltaDeBotones from "../components/AltaDeBotones";
import { listarClientes, type ClienteAdmin } from "../services/api";

// Panel de los administradores de la plataforma (nosotros).
//
// Va dentro de la PWA y no en el sitio web para no duplicar sesión, cliente
// de API y estilos; es una ruta más, que solo abre quien tiene
// isPlatformAdmin (se prende a mano en la base). Si alguien sin el permiso
// entra a /admin, el backend responde 403 y aquí se ve el aviso.
//
// Dos apartados: la lista de clientes (un renglón por botón registrado) y la
// fábrica, donde se dan de alta los botones antes de venderlos —lo que antes
// solo se podía hacer por terminal—. Antes tenía las solicitudes de pago,
// pero se quitó ese sistema. Falta lo que era la prioridad original del
// roadmap: estado de los botones, alertas recientes con cuánto tardaron en
// atenderse, y entregas de push fallidas.

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default function Admin() {
  const [busqueda, setBusqueda] = useState("");
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setClientes(await listarClientes({ q: busqueda.trim() || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setCargando(false);
    }
  }, [busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Administración</h1>
          <div className="flex items-center gap-4">
            <button onClick={cargar} className="text-sm font-medium text-slate-500 hover:text-red-600">
              Actualizar
            </button>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-red-600">
              Salir
            </Link>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-semibold text-slate-900">Clientes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Un renglón por botón registrado, con quien lo dio de alta.
        </p>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por correo, apodo o código del botón"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {cargando && <p className="mt-4 text-sm text-slate-500">Cargando…</p>}

        {!cargando && (
          <ul className="mt-4 space-y-2">
            {clientes.length === 0 && (
              <li className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No hay clientes con esa búsqueda.
              </li>
            )}
            {clientes.map((c) => (
              <li
                key={c.deviceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{c.cliente.nombre}</p>
                  <p className="truncate text-xs text-slate-500">{c.cliente.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.nombre} · {c.deviceCode}
                    {c.grupo && ` · ${c.grupo}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    Registrado el {fecha(c.cliente.registradoEl)}
                    {c.acompanantes.length > 0 && ` · comparte con ${c.acompanantes.join(", ")}`}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {c.titulares} de {c.titularesTotales} titulares
                </span>
              </li>
            ))}
          </ul>
        )}

        <AltaDeBotones />
      </div>
    </div>
  );
}
