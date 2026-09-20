import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  obtenerAcceso,
  retirarAcceso,
  vincularCodigo,
  type Acceso,
} from "../services/api";

const CLASE_INPUT =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

// Apartado de Códigos: es donde una cuenta se vuelve "completa".
//
// Quien compra un botón captura aquí (o al registrarse) el código impreso en
// su caja. El mismo código vale para dos personas, porque el botón es de la
// casa: los dos que viven ahí tienen las funciones completas. Los demás del
// grupo entran como invitados, y el titular les puede dar uno de los accesos
// que haya comprado.
export default function Codigos() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [codigo, setCodigo] = useState("");
  const [vinculando, setVinculando] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);
  // El registro manda aquí a quien capturó un código que no se pudo vincular.
  const [error, setError] = useState<string | null>(
    (state as { error?: string } | null)?.error ?? null
  );
  const [listo, setListo] = useState<string | null>(null);

  const cargar = useCallback(() => {
    obtenerAcceso()
      .then(setAcceso)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar tu acceso"));
  }, []);

  useEffect(cargar, [cargar]);

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    setVinculando(true);
    setError(null);
    setListo(null);
    try {
      await vincularCodigo(codigo);
      setCodigo("");
      setListo("Listo: tu cuenta quedó vinculada al botón y ya puedes enviar alertas.");
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo vincular el código");
    } finally {
      setVinculando(false);
    }
  };

  const quitar = async (deviceId: string, userId: string, nombre: string) => {
    if (!confirm(`${nombre} dejará de poder enviar alertas. ¿Continuar?`)) return;
    setQuitando(userId);
    setError(null);
    try {
      await retirarAcceso(deviceId, userId);
      cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar el acceso");
    } finally {
      setQuitando(null);
    }
  };

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Códigos</h1>
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-red-600">
            Volver
          </Link>
        </div>

        {acceso && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              acceso.completo ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"
            }`}
          >
            {acceso.completo
              ? acceso.esTitular
                ? "Tu cuenta está vinculada a un botón: puedes enviar alertas en todos tus grupos."
                : "Un titular te dio uno de sus accesos: puedes enviar alertas en todos tus grupos."
              : "Tu cuenta es de invitado: puedes leer y escribir en el chat de tus grupos, pero no enviar alertas. Captura el código de tu botón aquí abajo."}
          </p>
        )}

        {/* --- Capturar el código de la caja --- */}
        <form onSubmit={confirmar} className="mt-5">
          <label className="block text-sm font-medium text-slate-700">
            Código del botón
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="ABC-DEF-GHJ"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${CLASE_INPUT} font-mono uppercase tracking-wider`}
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Viene impreso en la caja. Sirve para dos personas: tú y quien viva contigo.
          </p>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {listo && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{listo}</p>
          )}

          <button
            type="submit"
            disabled={vinculando || codigo.trim().length === 0}
            className="mt-3 w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {vinculando ? "Confirmando…" : "Confirmar"}
          </button>
        </form>

        {/* --- Tus botones y los accesos que repartes --- */}
        {acceso?.botones.map((b) => (
          <section key={b.id} className="mt-6 border-t border-slate-100 pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-700">{b.nombre}</h2>
              <span className="text-xs text-slate-400">
                {b.grupo ? b.grupo.name : "Sin grupo todavía"}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Titulares: {b.titulares.map((t) => t.nombre).join(" y ")} ({b.titulares.length} de 2)
            </p>

            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <p className="text-slate-700">
                Accesos completos para repartir:{" "}
                <strong>
                  {b.accesos.libres} de {b.accesos.comprados}
                </strong>
              </p>
              {b.accesos.comprados === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  De fábrica el botón da funciones completas solo a sus dos titulares. Amplía tu
                  límite para que otras cinco personas de tu grupo también puedan enviar alertas.
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">
                  Los repartes desde la información de tu grupo, junto a cada persona.
                </p>
              )}

              {/* Abre el chat con los administradores: ahí van los datos
                  bancarios y se manda la captura del depósito. */}
              <button
                type="button"
                onClick={() => navigate(`/pago?boton=${encodeURIComponent(b.id)}`)}
                className="mt-2 w-full rounded-lg bg-white py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                Ampliar límite
              </button>
            </div>

            {b.repartidosA.length > 0 && (
              <ul className="mt-2 space-y-1">
                {b.repartidosA.map((p) => (
                  <li
                    key={p.userId}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{p.nombre}</span>
                      <span className="block truncate text-xs text-slate-400">{p.email}</span>
                    </span>
                    <button
                      onClick={() => quitar(b.id, p.userId, p.nombre)}
                      disabled={quitando === p.userId}
                      className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-60"
                    >
                      {quitando === p.userId ? "…" : "Quitar"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
