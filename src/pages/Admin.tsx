import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AltaDeBotones from "../components/AltaDeBotones";
import { listarBotonesEnUso, type BotonEnUso } from "../services/api";

// Panel de los administradores de la plataforma (nosotros).
//
// Va dentro de la PWA y no en el sitio web para no duplicar sesión, cliente
// de API y estilos; es una ruta más, que solo abre quien tiene
// isPlatformAdmin (se prende a mano en la base). Si alguien sin el permiso
// entra a /admin, el backend responde 403 y aquí se ve el aviso.
//
// Dos apartados: los botones en uso y la fábrica, donde se dan de alta los
// botones antes de venderlos —lo que antes solo se podía hacer por terminal—.
//
// Cada botón en uso muestra dos listas que son cosas distintas: las PERSONAS
// vinculadas (quienes lo comparten, hasta tres) y los GRUPOS vinculados (a
// quienes les avisa, hasta tres). Antes esto era una lista de "clientes" que
// titulaba cada renglón con la primera persona y mezclaba todo en una línea. Antes tenía las solicitudes de pago,
// pero se quitó ese sistema. Falta lo que era la prioridad original del
// roadmap: estado de los botones, alertas recientes con cuánto tardaron en
// atenderse, y entregas de push fallidas.

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default function Admin() {
  const [busqueda, setBusqueda] = useState("");
  const [botones, setBotones] = useState<BotonEnUso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setBotones(await listarBotonesEnUso({ q: busqueda.trim() || undefined }));
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

        <h2 className="mt-6 text-lg font-semibold text-slate-900">Botones en uso</h2>
        <p className="mt-1 text-sm text-slate-500">
          Un renglón por botón: quiénes lo comparten y a qué grupos les avisa.
        </p>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, correo, apodo o grupo"
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {cargando && <p className="mt-4 text-sm text-slate-500">Cargando…</p>}

        {!cargando && (
          <ul className="mt-4 space-y-2">
            {botones.length === 0 && (
              <li className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No hay botones con esa búsqueda.
              </li>
            )}
            {botones.map((b) => (
              <li key={b.deviceId} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="font-mono text-base font-semibold text-slate-900">
                  {b.deviceCode}
                  {b.nombre && (
                    <span className="ml-2 font-sans text-sm font-normal text-slate-500">{b.nombre}</span>
                  )}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="flex items-baseline justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                      Personas vinculadas
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] normal-case text-slate-700">
                        {b.personas.length} de {b.personasTotales}
                      </span>
                    </p>
                    <ul className="mt-1 space-y-1">
                      {b.personas.map((p) => (
                        <li key={p.userId} className="text-sm text-slate-900">
                          {p.nombre}
                          <span className="block truncate text-xs text-slate-500">{p.email}</span>
                          <span className="block text-xs text-slate-400">desde el {fecha(p.desde)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="flex items-baseline justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
                      Grupos vinculados
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] normal-case text-slate-700">
                        {b.grupos.length} de {b.gruposTotales}
                      </span>
                    </p>
                    {b.grupos.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-400">Sin grupo: si se presiona, no avisa a nadie.</p>
                    ) : (
                      <ul className="mt-1 space-y-1">
                        {b.grupos.map((g) => (
                          <li key={g} className="text-sm text-slate-900">
                            {g}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <AltaDeBotones />
      </div>
    </div>
  );
}
