import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  actualizarGrupo,
  cambiarRolMiembro,
  desvincularBoton,
  eliminarGrupo,
  obtenerAcceso,
  regenerarCodigoInvitacion,
  salirDelGrupo,
  vincularBoton,
  type Acceso,
  type DetalleGrupo,
  type EstadoBoton,
} from "../services/api";
import { describirGrupos, GRUPOS_POR_BOTON } from "../services/gruposDelBoton";

const ESTADO_BOTON: Record<EstadoBoton, { texto: string; clase: string }> = {
  ONLINE: { texto: "En línea", clase: "bg-emerald-100 text-emerald-800" },
  IRREGULAR: { texto: "Señal irregular", clase: "bg-amber-100 text-amber-800" },
  OFFLINE: { texto: "Sin conexión", clase: "bg-slate-200 text-slate-600" },
  EMERGENCY: { texto: "EMERGENCIA", clase: "bg-red-600 text-white" },
  MAINTENANCE: { texto: "Mantenimiento", clase: "bg-sky-100 text-sky-800" },
};

const CLASE_INPUT =
  "mt-1 w-full rounded-lg border border-[var(--borde-tenue)] bg-[var(--fondo)] px-3 py-2 text-sm text-[var(--texto)] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

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
  const [guardandoCupo, setGuardandoCupo] = useState(false);
  const [errorCupo, setErrorCupo] = useState<string | null>(null);
  const [regenerando, setRegenerando] = useState(false);
  const [cambiandoRol, setCambiandoRol] = useState<string | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [nombreEscrito, setNombreEscrito] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorSalida, setErrorSalida] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [formularioBoton, setFormularioBoton] = useState(false);
  // Los botones de la cuenta, para elegir cuál se vincula. Se piden al abrir el
  // formulario y no antes: la mayoría de las veces nadie lo abre.
  const [misBotones, setMisBotones] = useState<Acceso["botones"] | null>(null);
  const [botonElegido, setBotonElegido] = useState("");
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

  // Abrir el formulario trae los botones de la cuenta: se elige entre ELLOS. Ya
  // no se escribe el código de la caja aquí: eso agregaba a la persona como
  // titular de un botón que nadie le había compartido.
  const abrirVinculacion = async () => {
    setErrorBoton(null);
    setBotonElegido("");
    setFormularioBoton(true);
    try {
      setMisBotones((await obtenerAcceso()).botones);
    } catch (err) {
      setMisBotones([]);
      setErrorBoton(err instanceof Error ? err.message : "No se pudieron cargar tus botones");
    }
  };

  const vincular = async (e: FormEvent) => {
    e.preventDefault();
    if (!botonElegido) return;
    setVinculando(true);
    setErrorBoton(null);
    try {
      await vincularBoton(grupo.id, botonElegido);
      setBotonElegido("");
      setFormularioBoton(false);
      alCambiar();
    } catch (err) {
      setErrorBoton(err instanceof Error ? err.message : "No se pudo vincular");
    } finally {
      setVinculando(false);
    }
  };

  const desvincular = async (deviceId: string, comoSeLlama: string) => {
    const aviso = `${comoSeLlama} dejará de avisar a este grupo (en los demás sigue avisando). Puedes volver a vincularlo desde aquí. ¿Continuar?`;
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

  // Se guarda al salir del campo y no con un botón aparte: es un solo número,
  // y un "Guardar" más sería un paso de más para cambiar un 10 por un 20.
  const guardarCupo = async (valor: number) => {
    // El campo vacío da NaN y un 0 que el backend rechazaría: se deja como estaba.
    if (!Number.isFinite(valor) || valor < 1 || valor === grupo.cupos.total) return;
    setErrorCupo(null);
    setGuardandoCupo(true);
    try {
      await actualizarGrupo(grupo.id, { maxMembers: valor });
      alCambiar();
    } catch (err) {
      setErrorCupo(err instanceof Error ? err.message : "No se pudo cambiar el cupo");
    } finally {
      setGuardandoCupo(false);
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
          <h2 className="text-sm font-medium" style={{ color: "var(--texto)" }}>
            Establecimiento
          </h2>
          {esAdmin && !editando && (
            <button onClick={abrirEdicion} className="text-xs font-medium text-red-600 hover:underline">
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form
            onSubmit={guardar}
            className="mt-2 space-y-3 rounded-lg p-3"
            style={{ background: "var(--superficie-suave)" }}
          >
            <label className="block text-sm" style={{ color: "var(--texto)" }}>
              Nombre
              <input
                required
                maxLength={80}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={CLASE_INPUT}
              />
            </label>
            <label className="block text-sm" style={{ color: "var(--texto)" }}>
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
            {error && (
              <p
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--superficie)", color: "var(--peligro)" }}
              >
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 rounded-lg py-2 text-sm font-medium disabled:opacity-60"
                style={{ background: "var(--texto)", color: "var(--fondo)" }}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={guardando}
                className="flex-1 rounded-lg py-2 text-sm font-medium"
                style={{ background: "var(--fondo)", color: "var(--texto)", boxShadow: "inset 0 0 0 1px var(--borde-tenue)" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-1 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--superficie-suave)" }}>
            <p className="font-medium" style={{ color: "var(--texto)" }}>
              {grupo.name}
            </p>
            {grupo.address ? (
              <p style={{ color: "var(--texto-tenue)" }}>{grupo.address}</p>
            ) : (
              // Grupos creados antes de que la dirección fuera obligatoria.
              // --alerta/--alerta-texto van siempre juntos (son la pareja
              // fondo+texto del "!" de alertas del chat): usar el texto solo
              // sobre esta tarjeta se leería mal en oscuro, porque ese color
              // se pensó para ir encima del amarillo, no del gris de la
              // tarjeta.
              <p
                className="inline-block rounded px-2 py-0.5 text-xs font-medium"
                style={{ background: "var(--alerta)", color: "var(--alerta-texto)" }}
              >
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
          <h2 className="text-sm font-medium" style={{ color: "var(--texto)" }}>
            Botones
          </h2>
          <button
            onClick={alCambiar}
            className="text-xs font-medium text-[var(--texto-tenue)] hover:text-red-600"
          >
            Actualizar
          </button>
        </div>
        <p className="mt-0.5 text-xs" style={{ color: "var(--texto-tenue)" }}>
          Vincular un botón aquí no cambia quién puede alertar ni cuánta gente cabe: solo decide a
          dónde llega la alerta cuando se presiona el aparato físico. Un mismo botón puede avisar
          hasta a {GRUPOS_POR_BOTON} grupos.
        </p>
        {grupo.devices.length === 0 ? (
          <p className="mt-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
            Aún no hay botones vinculados a este grupo.
          </p>
        ) : (
          <ul className="mt-1 space-y-1">
            {grupo.devices.map((d) => {
              const estado = ESTADO_BOTON[d.status];
              const comoSeLlama = d.name || d.deviceCode;
              return (
                <li
                  key={d.id}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: "var(--superficie-suave)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 font-medium" style={{ color: "var(--texto)" }}>
                      <span className="block truncate">{comoSeLlama}</span>
                      {d.titulares.length > 0 && (
                        <span
                          className="block truncate text-xs font-normal"
                          style={{ color: "var(--texto-tenue)" }}
                        >
                          de {d.titulares.map((t) => t.nombre).join(" y ")}
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </div>
                  <p
                    className="mt-0.5 flex items-center justify-between gap-2 text-xs"
                    style={{ color: "var(--texto-tenue)" }}
                  >
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
                        className="shrink-0 font-medium text-[var(--texto-tenue)] hover:text-red-600 disabled:opacity-60"
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
          <form
            onSubmit={vincular}
            className="mt-2 space-y-2 rounded-lg p-3 text-sm"
            style={{ background: "var(--superficie-suave)" }}
          >
            {misBotones === null ? (
              <p style={{ color: "var(--texto-tenue)" }}>Cargando tus botones…</p>
            ) : misBotones.length === 0 ? (
              <p style={{ color: "var(--texto)" }}>
                No tienes ningún botón en tu cuenta. Para agregar uno, captura el código de su caja
                en{" "}
                <Link to="/codigos" className="font-bold underline">
                  Códigos
                </Link>
                ; después lo eliges aquí.
              </p>
            ) : (
              <fieldset className="space-y-1">
                <legend style={{ color: "var(--texto)" }}>¿Cuál de tus botones avisa a este grupo?</legend>
                {misBotones.map((b) => {
                  const yaEsta = b.grupos.some((g) => g.id === grupo.id);
                  const lleno = b.grupos.length >= GRUPOS_POR_BOTON;
                  const noSePuede = yaEsta || lleno;
                  return (
                    <label
                      key={b.id}
                      className={`flex items-start gap-2 rounded-lg p-2 ring-1 ring-[var(--borde-tenue)] ${
                        noSePuede ? "opacity-50" : "cursor-pointer"
                      }`}
                      style={{ background: "var(--fondo)" }}
                    >
                      <input
                        type="radio"
                        name="boton"
                        value={b.id}
                        disabled={noSePuede}
                        checked={botonElegido === b.id}
                        onChange={() => setBotonElegido(b.id)}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <span className="block font-medium" style={{ color: "var(--texto)" }}>
                          {b.nombre}{" "}
                          <span className="font-mono text-xs" style={{ color: "var(--texto-tenue)" }}>
                            {b.deviceCode}
                          </span>
                        </span>
                        <span className="block text-xs" style={{ color: "var(--texto-tenue)" }}>
                          {yaEsta
                            ? "Ya avisa a este grupo."
                            : lleno
                              ? `Ya avisa a ${GRUPOS_POR_BOTON} grupos, que es el máximo: desvincúlalo de alguno primero.`
                              : b.grupos.length > 0
                                ? `Ya avisa a: ${describirGrupos(b.grupos)}.`
                                : "Todavía no avisa a ningún grupo."}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
            {errorBoton && (
              <p
                className="rounded-lg px-3 py-2"
                style={{ background: "var(--superficie)", color: "var(--peligro)" }}
              >
                {errorBoton}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={vinculando || !botonElegido}
                className="flex-1 rounded-lg py-2 font-medium disabled:opacity-60"
                style={{ background: "var(--texto)", color: "var(--fondo)" }}
              >
                {vinculando ? "Vinculando…" : "Vincular"}
              </button>
              <button
                type="button"
                onClick={() => setFormularioBoton(false)}
                className="flex-1 rounded-lg py-2 font-medium"
                style={{ background: "var(--fondo)", color: "var(--texto)", boxShadow: "inset 0 0 0 1px var(--borde-tenue)" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <>
            {errorBoton && (
              <p
                className="mt-2 rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--superficie-suave)", color: "var(--peligro)" }}
              >
                {errorBoton}
              </p>
            )}
            <button
              onClick={() => void abrirVinculacion()}
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium"
              style={{ background: "var(--fondo)", color: "var(--texto)", boxShadow: "inset 0 0 0 1px var(--borde-tenue)" }}
            >
              Vincular un botón
            </button>
          </>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
            Miembros
          </h2>
          <span className="text-xs" style={{ color: "var(--texto-tenue)" }}>
            {grupo.cupos.ocupados} de {grupo.cupos.total}
          </span>
        </div>
        <p className="mt-0.5 text-xs" style={{ color: "var(--texto-tenue)" }}>
          Quien tiene un botón vinculado a su cuenta puede enviar alertas. Los demás participan en
          el chat como invitados. El código de la caja vale para tres personas.
        </p>

        {/* El cupo es del grupo y lo mueve su administrador. Se muestra a
            todos —saber cuánto queda evita repartir el código de invitación
            de más— pero solo el ADMIN ve el control. */}
        {esAdmin ? (
          <div className="mt-2 flex items-center gap-2 rounded-xl p-3" style={{ background: "var(--superficie-suave)" }}>
            <label className="flex-1 text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
              Cupo del grupo
              <span className="mt-0.5 block text-[11px] font-normal normal-case" style={{ color: "var(--texto-tenue)" }}>
                Hasta {grupo.cupos.tope} personas. No se puede bajar de las {grupo.cupos.ocupados} que
                ya están.
              </span>
            </label>
            <input
              type="number"
              min={grupo.cupos.ocupados}
              max={grupo.cupos.tope}
              defaultValue={grupo.cupos.total}
              disabled={guardandoCupo}
              onBlur={(e) => {
                const valor = Number(e.target.value);
                // Vacío o fuera de rango: el campo vuelve a lo que ya había.
                if (!Number.isFinite(valor) || valor < 1) {
                  e.target.value = String(grupo.cupos.total);
                  return;
                }
                guardarCupo(valor);
              }}
              className="w-20 rounded-xl border-2 px-2 py-1.5 text-center text-sm font-bold outline-none disabled:opacity-50"
              style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
              aria-label="Cupo del grupo"
            />
          </div>
        ) : (
          <p className="mt-1 text-xs" style={{ color: "var(--texto-tenue)" }}>
            Quedan {grupo.cupos.libres} {grupo.cupos.libres === 1 ? "lugar libre" : "lugares libres"}.
          </p>
        )}
        {errorCupo && (
          <p className="mt-1 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--superficie-suave)", color: "var(--peligro)" }}>
            {errorCupo}
          </p>
        )}
        <ul className="mt-1 space-y-1">
          {grupo.members.map((m) => (
            <li
              key={m.userId}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "var(--superficie-suave)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="font-medium" style={{ color: "var(--texto)" }}>
                    {m.displayName || m.email}
                  </span>
                  {m.userId === grupo.myUserId && (
                    <span style={{ color: "var(--texto-tenue)" }}> (tú)</span>
                  )}
                  {m.displayName && (
                    <span className="block truncate text-xs" style={{ color: "var(--texto-tenue)" }}>
                      {m.email}
                    </span>
                  )}
                  <span className="block truncate text-xs" style={{ color: "var(--texto-tenue)" }}>
                    {(() => {
                      const suyos = grupo.devices.filter((d) =>
                        d.titulares.some((t) => t.userId === m.userId)
                      );
                      if (suyos.length > 0) {
                        return `Titular de ${suyos.map((d) => d.name || d.deviceCode).join(", ")}`;
                      }
                      return m.accesoCompleto
                        ? "Puede alertar con su botón"
                        : "Invitado: solo chat";
                    })()}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      m.accesoCompleto ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {m.accesoCompleto ? "Puede alertar" : "Invitado"}
                  </span>
                  <span className="text-xs uppercase" style={{ color: "var(--texto-tenue)" }}>
                    {m.role}
                  </span>
                </span>
              </div>

              {esAdmin && (
                <div className="mt-1 flex justify-end gap-3">
                  {esAdmin && m.userId !== grupo.myUserId && (
                    <button
                      onClick={() => hacerAdmin(m.userId, m.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                      disabled={cambiandoRol === m.userId}
                      className="text-xs font-medium text-[var(--texto-tenue)] hover:text-red-600 disabled:opacity-60"
                    >
                      {m.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>


        {grupo.inviteCode && (
          <div className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--superficie-suave)" }}>
            <p style={{ color: "var(--texto-tenue)" }}>Código para invitar a alguien:</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <code className="font-mono text-base tracking-wider" style={{ color: "var(--texto)" }}>
                {grupo.inviteCode}
              </code>
              <div className="flex gap-3">
                <button onClick={copiarCodigo} className="text-xs font-medium text-red-600 hover:underline">
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={regenerar}
                  disabled={regenerando}
                  className="text-xs font-medium text-[var(--texto-tenue)] hover:text-red-600 disabled:opacity-60"
                >
                  {regenerando ? "…" : "Nuevo código"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="border-t pt-4" style={{ borderColor: "var(--borde-tenue)" }}>
        {errorSalida && (
          <p
            className="mb-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--superficie-suave)", color: "var(--peligro)" }}
          >
            {errorSalida}
          </p>
        )}

        <button
          onClick={salir}
          disabled={saliendo}
          className="w-full rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--fondo)", color: "var(--peligro)", boxShadow: "inset 0 0 0 1px var(--peligro)" }}
        >
          {saliendo ? "Saliendo…" : "Salir del grupo"}
        </button>

        {esAdmin &&
          (confirmarEliminar ? (
            <form
              onSubmit={eliminar}
              className="mt-3 rounded-lg p-3 text-sm"
              style={{ background: "var(--superficie-suave)", boxShadow: "inset 0 0 0 1px var(--peligro)" }}
            >
              <p style={{ color: "var(--texto)" }}>
                Se borrarán el chat y el historial de alertas de <strong>{grupo.name}</strong>, y todos
                quedarán fuera. No se puede deshacer.
              </p>
              <label className="mt-2 block" style={{ color: "var(--texto)" }}>
                Escribe el nombre del grupo para confirmar:
                <input
                  required
                  value={nombreEscrito}
                  onChange={(e) => setNombreEscrito(e.target.value)}
                  placeholder={grupo.name}
                  className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none"
                  style={{ background: "var(--fondo)", color: "var(--texto)", borderColor: "var(--peligro)" }}
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
                  className="flex-1 rounded-lg py-2 font-medium"
                  style={{ background: "var(--fondo)", color: "var(--texto)", boxShadow: "inset 0 0 0 1px var(--borde-tenue)" }}
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
              className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-[var(--texto-tenue)] hover:text-red-700"
            >
              Eliminar grupo
            </button>
          ))}
      </section>
    </div>
  );
}
