import { useState, type FormEvent } from "react";
import {
  actualizarGrupo,
  regenerarCodigoInvitacion,
  type DetalleGrupo,
  type EstadoBoton,
} from "../services/api";

const ESTADO_BOTON: Record<EstadoBoton, { texto: string; clase: string }> = {
  ONLINE: { texto: "En línea", clase: "bg-emerald-100 text-emerald-800" },
  IRREGULAR: { texto: "Señal irregular", clase: "bg-amber-100 text-amber-800" },
  OFFLINE: { texto: "Sin conexión", clase: "bg-slate-200 text-slate-600" },
  EMERGENCY: { texto: "EMERGENCIA", clase: "bg-red-600 text-white" },
  MAINTENANCE: { texto: "Mantenimiento", clase: "bg-sky-100 text-sky-800" },
};

const CLASE_INPUT =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

interface Props {
  grupo: DetalleGrupo;
  alCambiar: () => void;
}

export default function InfoGrupo({ grupo, alCambiar }: Props) {
  const esAdmin = grupo.role === "ADMIN";
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(grupo.name);
  const [direccion, setDireccion] = useState(grupo.address ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [regenerando, setRegenerando] = useState(false);

  const abrirEdicion = () => {
    setNombre(grupo.name);
    setDireccion(grupo.address ?? "");
    setError(null);
    setEditando(true);
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await actualizarGrupo(grupo.id, { name: nombre, address: direccion });
      setEditando(false);
      alCambiar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  const copiarCodigo = async () => {
    if (!grupo.inviteCode) return;
    try {
      await navigator.clipboard.writeText(grupo.inviteCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles el código sigue visible para copiarlo a mano.
    }
  };

  const regenerar = async () => {
    if (!confirm("El código actual dejará de funcionar. ¿Generar uno nuevo?")) return;
    setRegenerando(true);
    try {
      await regenerarCodigoInvitacion(grupo.id);
      alCambiar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el código");
    } finally {
      setRegenerando(false);
    }
  };

  const mapa =
    grupo.latitude != null && grupo.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${grupo.latitude},${grupo.longitude}`
      : grupo.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(grupo.address)}`
        : null;

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Establecimiento</h2>
          {esAdmin && !editando && (
            <button onClick={abrirEdicion} className="text-xs font-medium text-red-600 hover:underline">
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form onSubmit={guardar} className="mt-2 space-y-3 rounded-lg bg-slate-50 p-3">
            <label className="block text-sm text-slate-700">
              Nombre
              <input
                required
                maxLength={80}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-sm text-slate-700">
              Dirección
              <input
                required
                maxLength={200}
                placeholder="Calle, número, colonia, ciudad"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className={CLASE_INPUT}
              />
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={guardando}
                className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="font-medium text-slate-800">{grupo.name}</p>
            {grupo.address ? (
              <p className="text-slate-600">{grupo.address}</p>
            ) : (
              // Grupos creados antes de que la dirección fuera obligatoria.
              <p className="text-amber-700">
                Sin dirección registrada.{" "}
                {esAdmin ? "Agrégala: es lo que se necesita para llegar en una emergencia." : "Pídele al administrador que la agregue."}
              </p>
            )}
            {mapa && (
              <a href={mapa} target="_blank" rel="noreferrer" className="text-sm font-medium text-red-600 hover:underline">
                Ver en Google Maps
              </a>
            )}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Botones</h2>
          <button onClick={alCambiar} className="text-xs font-medium text-slate-500 hover:text-red-600">
            Actualizar
          </button>
        </div>
        {grupo.devices.length === 0 ? (
          <p className="mt-1 text-sm text-slate-400">Aún no hay botones vinculados a este grupo.</p>
        ) : (
          <ul className="mt-1 space-y-1">
            {grupo.devices.map((d) => {
              const estado = ESTADO_BOTON[d.status];
              return (
                <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{d.name || d.deviceCode}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {d.lastSeenAt
                      ? `Última señal: ${new Date(d.lastSeenAt).toLocaleString("es-MX")}`
                      : "Nunca se ha conectado"}
                    {d.batteryLevel != null && ` · Batería ${d.batteryLevel}%`}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700">Miembros ({grupo.members.length})</h2>
        <ul className="mt-1 space-y-1">
          {grupo.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>
                <span className="font-medium text-slate-800">{m.displayName || m.email}</span>
                {m.userId === grupo.myUserId && <span className="text-slate-400"> (tú)</span>}
                {m.displayName && <span className="block text-xs text-slate-400">{m.email}</span>}
              </span>
              <span className="text-xs uppercase text-slate-400">{m.role}</span>
            </li>
          ))}
        </ul>

        {grupo.inviteCode && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="text-slate-500">Código para invitar a alguien:</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono text-base tracking-wider text-slate-900">{grupo.inviteCode}</code>
              <div className="flex gap-3">
                <button onClick={copiarCodigo} className="text-xs font-medium text-red-600 hover:underline">
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={regenerar}
                  disabled={regenerando}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-60"
                >
                  {regenerando ? "…" : "Nuevo código"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
