import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  actualizarGrupo,
  cambiarRolMiembro,
  desvincularBoton,
  eliminarGrupo,
  regenerarCodigoInvitacion,
  salirDelGrupo,
  vincularBoton,
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
  const navigate = useNavigate();
  const esAdmin = grupo.role === "ADMIN";
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(grupo.name);
  const [direccion, setDireccion] = useState(grupo.address ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [nombreEscrito, setNombreEscrito] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorSalida, setErrorSalida] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [formularioBoton, setFormularioBoton] = useState(false);
  const [codigoBoton, setCodigoBoton] = useState("");
  const [nombreBoton, setNombreBoton] = useState("");
  const [errorBoton, setErrorBoton] = useState<string | null>(null);
  const [desvinculando, setDesvinculando] = useState<string | null>(null);

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

  const vincular = async (e: FormEvent) => {
    e.preventDefault();
    setVinculando(true);
    setErrorBoton(null);
    try {
      await vincularBoton(grupo.id, codigoBoton, nombreBoton.trim() || undefined);
      setCodigoBoton("");
      setNombreBoton("");
      setFormularioBoton(false);
      alCambiar();
    } catch (err) {
      setErrorBoton(err instanceof Error ? err.message : "No se pudo vincular");
    } finally {
      setVinculando(false);
    }
  };

  const desvincular = async (deviceId: string, comoSeLlama: string) => {
    const aviso = `${comoSeLlama} dejará de avisar a este grupo. Puedes volver a vincularlo con el código de su caja. ¿Continuar?`;
    if (!confirm(aviso)) return;
    setDesvinculando(deviceId);
    setErrorBoton(null);
    try {
      await desvincularBoton(grupo.id, deviceId);
      alCambiar();
    } catch (err) {
      setErrorBoton(err instanceof Error ? err.message : "No se pudo desvincular");
    } finally {
      setDesvinculando(null);
    }
  };

  const hacerAdmin = async (userId: string, role: "ADMIN" | "MEMBER") => {
    setCambiandoRol(userId);
    setError(null);
    try {
      await cambiarRolMiembro(grupo.id, userId, role);
      alCambiar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el rol");
    } finally {
      setCambiandoRol(null);
    }
  };

  const salir = async () => {
    if (!confirm(`Vas a salir de ${grupo.name} y dejarás de recibir sus alertas. ¿Seguro?`)) return;
    setSaliendo(true);
    setErrorSalida(null);
    try {
      await salirDelGrupo(grupo.id);
      navigate("/", { replace: true });
    } catch (err) {
      setErrorSalida(err instanceof Error ? err.message : "No se pudo salir del grupo");
    } finally {
      setSaliendo(false);
    }
  };

  const eliminar = async (e: FormEvent) => {
    e.preventDefault();
    setEliminando(true);
    setErrorSalida(null);
    try {
      await eliminarGrupo(grupo.id, nombreEscrito);
      navigate("/", { replace: true });
    } catch (err) {
      setErrorSalida(err instanceof Error ? err.message : "No se pudo eliminar el grupo");
    } finally {
      setEliminando(false);
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
              const comoSeLlama = d.name || d.deviceCode;
              return (
                <li key={d.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 font-medium text-slate-800">
                      <span className="block truncate">{comoSeLlama}</span>
                      {d.owner && (
                        <span className="block truncate text-xs font-normal text-slate-500">
                          de {d.owner.nombre}
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <p className="mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="min-w-0 truncate">
                      {d.lastSeenAt
                        ? `Última señal: ${new Date(d.lastSeenAt).toLocaleString("es-MX")}`
                        : "Nunca se ha conectado"}
                      {d.batteryLevel != null && ` · Batería ${d.batteryLevel}%`}
                    </span>
                    {d.puedoDesvincular && (
                      <button
                        onClick={() => desvincular(d.id, comoSeLlama)}
                        disabled={desvinculando === d.id}
                        className="shrink-0 font-medium text-slate-500 hover:text-red-600 disabled:opacity-60"
                      >
                        {desvinculando === d.id ? "…" : "Desvincular"}
                      </button>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {formularioBoton ? (
          <form onSubmit={vincular} className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
            <label className="block text-slate-700">
              Código de vinculación
              <input
                required
                autoFocus
                value={codigoBoton}
                onChange={(e) => setCodigoBoton(e.target.value)}
                placeholder="ABC-DEF-GHJ"
                autoCapitalize="characters"
                className={`${CLASE_INPUT} font-mono uppercase tracking-wider`}
              />
              <span className="mt-1 block text-xs text-slate-500">Viene impreso en la caja del botón.</span>
            </label>
            <label className="block text-slate-700">
              ¿Cómo le llamamos? (opcional)
              <input
                maxLength={60}
                value={nombreBoton}
                onChange={(e) => setNombreBoton(e.target.value)}
                placeholder="Caja 1, Recámara, Casa de Juan…"
                className={CLASE_INPUT}
              />
            </label>
            {errorBoton && <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{errorBoton}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={vinculando}
                className="flex-1 rounded-lg bg-slate-900 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {vinculando ? "Vinculando…" : "Vincular"}
              </button>
              <button
                type="button"
                onClick={() => setFormularioBoton(false)}
                className="flex-1 rounded-lg bg-white py-2 font-medium text-slate-700 ring-1 ring-slate-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            {errorBoton && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorBoton}</p>
            )}
            <button
              onClick={() => {
                setErrorBoton(null);
                setFormularioBoton(true);
              }}
              className="mt-2 w-full rounded-lg bg-white py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Vincular un botón
            </button>
          </>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700">Miembros ({grupo.members.length})</h2>
        <ul className="mt-1 space-y-1">
          {grupo.members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-slate-800">{m.displayName || m.email}</span>
                {m.userId === grupo.myUserId && <span className="text-slate-400"> (tú)</span>}
                {m.displayName && <span className="block truncate text-xs text-slate-400">{m.email}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                {esAdmin && m.userId !== grupo.myUserId && (
                  <button
                    onClick={() => hacerAdmin(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                    disabled={cambiandoRol === m.userId}
                    className="text-xs font-medium text-red-600 hover:underline disabled:opacity-60"
                  >
                    {m.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                  </button>
                )}
                <span className="text-xs uppercase text-slate-400">{m.role}</span>
              </span>
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

      <section className="border-t border-slate-200 pt-4">
        {errorSalida && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorSalida}</p>
        )}

        <button
          onClick={salir}
          disabled={saliendo}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
        >
          {saliendo ? "Saliendo…" : "Salir del grupo"}
        </button>

        {esAdmin &&
          (confirmarEliminar ? (
            <form onSubmit={eliminar} className="mt-3 rounded-lg bg-red-50 p-3 text-sm ring-1 ring-red-200">
              <p className="text-red-900">
                Se borrarán el chat y el historial de alertas de <strong>{grupo.name}</strong>, y todos
                quedarán fuera. No se puede deshacer.
              </p>
              <label className="mt-2 block text-red-900">
                Escribe el nombre del grupo para confirmar:
                <input
                  required
                  value={nombreEscrito}
                  onChange={(e) => setNombreEscrito(e.target.value)}
                  placeholder={grupo.name}
                  className="mt-1 w-full rounded-lg border border-red-300 px-3 py-2 focus:border-red-500 focus:outline-none"
                />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={eliminando || nombreEscrito.trim() !== grupo.name}
                  className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {eliminando ? "Eliminando…" : "Eliminar para siempre"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmarEliminar(false)}
                  className="flex-1 rounded-lg bg-white py-2 font-medium text-slate-700 ring-1 ring-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => {
                setNombreEscrito("");
                setErrorSalida(null);
                setConfirmarEliminar(true);
              }}
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-slate-500 hover:text-red-700"
            >
              Eliminar grupo
            </button>
          ))}
      </section>
    </div>
  );
}
