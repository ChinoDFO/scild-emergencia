import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { crearGrupo, obtenerAcceso, unirseAGrupo, type Acceso } from "../services/api";

// Crear un establecimiento (quien lo crea queda como ADMIN) o unirse a uno
// existente con el código que comparte su ADMIN.
//
// Crear pide tener un botón vinculado a la cuenta: un grupo donde nadie puede
// disparar una alerta es un chat, no un sistema de emergencia. Por eso la
// pestaña aparece bloqueada, con el motivo a la vista, en vez de esconderse:
// quien acaba de comprar su botón tiene que entender qué le falta.

const CLASE_CAMPO =
  "w-full rounded-xl border-2 px-3 py-2.5 text-sm outline-none focus:ring-2";

export default function GestionGrupos() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"unirse" | "crear">("unirse");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [vincular, setVincular] = useState(true);
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAcceso()
      .then(setAcceso)
      .catch(() => setAcceso(null));
  }, []);

  const puedeCrear = acceso?.completo ?? false;
  // Solo se ofrece vincular si el botón no está ya avisando a otro grupo.
  const botonLibre = acceso?.botones.find((b) => !b.grupo);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const groupId =
        modo === "unirse"
          ? (await unirseAGrupo(codigo)).groupId
          : (
              await crearGrupo({
                name: nombre,
                address: direccion,
                vincularBoton: Boolean(botonLibre) && vincular,
                ...(botonLibre ? { deviceId: botonLibre.id } : {}),
              })
            ).id;
      navigate(`/grupos/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar");
    } finally {
      setEnviando(false);
    }
  }

  const pestana = (valor: typeof modo, texto: string, bloqueada = false) => (
    <button
      type="button"
      disabled={bloqueada}
      onClick={() => {
        setModo(valor);
        setError(null);
      }}
      className="flex-1 rounded-lg py-1.5 text-xs font-bold uppercase disabled:opacity-40"
      style={{
        background: modo === valor ? "var(--fondo)" : "transparent",
        color: "var(--texto)",
      }}
    >
      {texto}
    </button>
  );

  return (
    <div>
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: "var(--superficie-suave)" }}
      >
        {pestana("unirse", "Unirme con código")}
        {pestana("crear", "Crear grupo", !puedeCrear)}
      </div>

      {!puedeCrear && (
        <p className="mt-2 text-xs" style={{ color: "var(--texto-tenue)" }}>
          Para crear un grupo necesitas un botón vinculado a tu cuenta. Captura el código de su
          caja en Códigos.
        </p>
      )}

      <form onSubmit={manejarEnvio} className="mt-3 space-y-3">
        {modo === "unirse" ? (
          <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
            Código de invitación
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              required
              autoCapitalize="characters"
              placeholder="ABC123…"
              className={`${CLASE_CAMPO} mt-1 font-mono uppercase tracking-wider`}
              style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
            />
          </label>
        ) : (
          <>
            <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
              Nombre del grupo
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={80}
                placeholder="Casa, Abarrotes, Coto Las Flores…"
                className={`${CLASE_CAMPO} mt-1 normal-case`}
                style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
              />
            </label>
            <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
              Dirección
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
                maxLength={200}
                placeholder="Calle, número y colonia"
                className={`${CLASE_CAMPO} mt-1 normal-case`}
                style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
              />
              <span className="mt-1 block text-[11px] font-normal normal-case" style={{ color: "var(--texto-tenue)" }}>
                Es lo que se necesita para llegar en una emergencia.
              </span>
            </label>

            {botonLibre && (
              <label
                className="flex cursor-pointer items-start gap-2 rounded-xl p-3"
                style={{ background: "var(--superficie-suave)" }}
              >
                <input
                  type="checkbox"
                  checked={vincular}
                  onChange={(e) => setVincular(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="text-xs" style={{ color: "var(--texto)" }}>
                  <span className="font-bold">Vincular «{botonLibre.nombre}» a este grupo</span>
                  <span className="mt-0.5 block" style={{ color: "var(--texto-tenue)" }}>
                    No cambia quién puede alertar ni cuánta gente cabe. Solo hace que, al presionar
                    el botón físico, la alerta llegue aquí. Lo puedes desvincular cuando quieras.
                  </span>
                </span>
              </label>
            )}
          </>
        )}

        {error && (
          <p
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: "var(--superficie-suave)", color: "var(--peligro)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-full py-2.5 text-sm font-bold uppercase disabled:opacity-50"
          style={{ background: "var(--texto)", color: "var(--fondo)" }}
        >
          {enviando ? "Un momento…" : modo === "unirse" ? "Unirme" : "Crear grupo"}
        </button>
      </form>
    </div>
  );
}
