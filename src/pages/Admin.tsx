import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ampliarLimite,
  aprobarSolicitud,
  listarClientes,
  listarSolicitudes,
  rechazarSolicitud,
  responderComoSoporte,
  type ClienteAdmin,
  type SolicitudAdmin,
} from "../services/api";

// Panel de los administradores de la plataforma (nosotros). Es lo único que
// puede subirle el límite a un cliente: la app nunca se lo da sola.
//
// Va dentro de la PWA y no en el sitio web para no duplicar sesión, cliente
// de API y estilos; es una ruta más, que solo abre quien tiene
// isPlatformAdmin (se prende a mano en la base). Si alguien sin el permiso
// entra a /admin, el backend responde 403 y aquí se ve el aviso.

const ESTADOS = [
  { id: "EN_REVISION", texto: "Por revisar" },
  { id: "ABIERTA", texto: "Esperando pago" },
  { id: "APROBADA", texto: "Aprobadas" },
  { id: "RECHAZADA", texto: "Rechazadas" },
  { id: "TODAS", texto: "Todas" },
];

const CLASE_ESTADO: Record<string, string> = {
  ABIERTA: "bg-amber-100 text-amber-900",
  EN_REVISION: "bg-sky-100 text-sky-900",
  APROBADA: "bg-emerald-100 text-emerald-900",
  RECHAZADA: "bg-red-100 text-red-900",
  CANCELADA: "bg-slate-200 text-slate-700",
};

const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function Admin() {
  const [vista, setVista] = useState<"solicitudes" | "clientes">("solicitudes");
  const [estado, setEstado] = useState("EN_REVISION");
  const [ampliados, setAmpliados] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [clientes, setClientes] = useState<ClienteAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      if (vista === "solicitudes") {
        setSolicitudes(await listarSolicitudes({ estado, q: busqueda.trim() || undefined }));
      } else {
        setClientes(
          await listarClientes({ ampliados: ampliados || undefined, q: busqueda.trim() || undefined })
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    } finally {
      setCargando(false);
    }
  }, [vista, estado, ampliados, busqueda]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conError = async (id: string, accion: () => Promise<void>) => {
    setOcupado(id);
    setError(null);
    try {
      await accion();
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar");
    } finally {
      setOcupado(null);
    }
  };

  const aprobar = (s: SolicitudAdmin) => {
    if (!confirm(`Confirmas el pago de ${s.cliente.nombre}. Se le suman 5 accesos. ¿Seguro?`)) return;
    conError(s.id, async () => {
      await aprobarSolicitud(s.id);
    });
  };

  const rechazar = (s: SolicitudAdmin) => {
    const motivo = prompt("¿Por qué se rechaza? El cliente lo va a leer.");
    if (!motivo?.trim()) return;
    conError(s.id, async () => {
      await rechazarSolicitud(s.id, motivo.trim());
    });
  };

  const responder = (s: SolicitudAdmin) => {
    const texto = prompt(`Mensaje para ${s.cliente.nombre}:`);
    if (!texto?.trim()) return;
    conError(s.id, async () => {
      await responderComoSoporte(s.id, texto.trim());
    });
  };

  const ampliar = (c: ClienteAdmin) => {
    if (!confirm(`${c.cliente.nombre} podrá dar acceso completo a 5 personas más. ¿Continuar?`)) return;
    conError(c.deviceId, async () => {
      await ampliarLimite(c.deviceId);
    });
  };

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

        {/* --- Vistas --- */}
        <div className="mt-4 flex gap-2">
          {(["solicitudes", "clientes"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                vista === v ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-300"
              }`}
            >
              {v === "solicitudes" ? "Solicitudes de pago" : "Clientes"}
            </button>
          ))}
        </div>

        {/* --- Filtros --- */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por correo, apodo o código del botón"
            className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          {vista === "solicitudes" ? (
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              {ESTADOS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.texto}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={ampliados}
              onChange={(e) => setAmpliados(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="si">Con límite ampliado</option>
              <option value="no">Sin ampliar</option>
            </select>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {cargando && <p className="mt-4 text-sm text-slate-500">Cargando…</p>}

        {/* --- Solicitudes --- */}
        {!cargando && vista === "solicitudes" && (
          <ul className="mt-4 space-y-3">
            {solicitudes.length === 0 && (
              <li className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No hay solicitudes con ese filtro.
              </li>
            )}
            {solicitudes.map((s) => (
              <li key={s.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{s.cliente.nombre}</p>
                    <p className="truncate text-xs text-slate-500">{s.cliente.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {s.boton.nombre} · {s.boton.deviceCode}
                      {s.boton.grupo && ` · ${s.boton.grupo}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      Solicitada el {fecha(s.createdAt)}
                      {s.proofAt && ` · comprobante el ${fecha(s.proofAt)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CLASE_ESTADO[s.status]}`}
                  >
                    {s.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-600">
                  Accesos del botón: {s.boton.accesosRepartidos} repartidos de{" "}
                  {s.boton.accesosComprados} comprados
                </p>

                {s.comprobante ? (
                  <a href={s.comprobante} target="_blank" rel="noreferrer" className="mt-2 block">
                    <img
                      src={s.comprobante}
                      alt="Comprobante de pago"
                      className="max-h-56 rounded-lg border border-slate-200 object-contain"
                    />
                    <span className="mt-1 block text-xs font-medium text-red-600">
                      Abrir comprobante
                    </span>
                  </a>
                ) : (
                  s.hayComprobante && (
                    <p className="mt-2 text-xs text-slate-400">
                      Hay comprobante. Filtra por "Por revisar" para verlo (el enlace caduca).
                    </p>
                  )
                )}

                {s.note && <p className="mt-2 text-xs text-slate-600">Nota: {s.note}</p>}
                {s.revisadaPor && (
                  <p className="mt-1 text-xs text-slate-400">
                    Revisada por {s.revisadaPor} el {s.reviewedAt && fecha(s.reviewedAt)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {s.status !== "APROBADA" && (
                    <button
                      onClick={() => aprobar(s)}
                      disabled={ocupado === s.id}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Aprobar (+5 accesos)
                    </button>
                  )}
                  {s.status !== "APROBADA" && s.status !== "RECHAZADA" && (
                    <button
                      onClick={() => rechazar(s)}
                      disabled={ocupado === s.id}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
                    >
                      Rechazar
                    </button>
                  )}
                  <button
                    onClick={() => responder(s)}
                    disabled={ocupado === s.id}
                    className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Escribirle
                  </button>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-slate-500">
                    Ver conversación ({s.messages.length})
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {s.messages.map((m) => (
                      <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
                        <span className="font-medium text-slate-700">
                          {m.from === "CLIENTE" ? "Cliente" : "Soporte"}
                        </span>{" "}
                        <span className="text-slate-400">{fecha(m.createdAt)}</span>
                        <p className="whitespace-pre-wrap text-slate-600">{m.body}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}

        {/* --- Clientes --- */}
        {!cargando && vista === "clientes" && (
          <ul className="mt-4 space-y-2">
            {clientes.length === 0 && (
              <li className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No hay clientes con ese filtro.
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
                    {c.acompanante ? ` · comparte con ${c.acompanante}` : " · código usado 1 de 2"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.lugaresOcupados} de 10 lugares · {c.accesosRepartidos} de{" "}
                    {c.accesosComprados} accesos repartidos
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.ampliado ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {c.ampliado ? `Ampliado (${c.accesosComprados})` : "Sin ampliar"}
                  </span>
                  <button
                    onClick={() => ampliar(c)}
                    disabled={ocupado === c.deviceId}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {ocupado === c.deviceId ? "…" : "Ampliar +5"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
