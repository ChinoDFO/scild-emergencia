import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { obtenerAcceso, vincularCodigo, type Acceso } from "../services/api";

const CLASE_INPUT =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

// Apartado de Códigos: es donde una cuenta se vuelve "completa".
//
// Quien compra un botón captura aquí (o al registrarse) el código impreso en
// su caja. El mismo código vale para dos personas, porque el botón es de la
// casa: los dos que viven ahí tienen las funciones completas. Los demás del
// grupo entran como invitados y ahí se quedan: el permiso de alertar no se
// presta ni se compra.
export default function Codigos() {
  const { state } = useLocation();
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [codigo, setCodigo] = useState("");
  const [vinculando, setVinculando] = useState(false);
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
              ? "Tu cuenta está vinculada a un botón: puedes enviar alertas en todos tus grupos."
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

        {/* --- Tus botones --- */}
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
            {b.titulares.length >= 2 && (
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Este botón ya tiene sus dos titulares. Ese número no se amplía: el código de la
                caja vale exactamente dos veces, siempre. Los demás del grupo entran como
                invitados y participan en el chat, pero no envían alertas; para poder hacerlo
                necesitan su propio botón.
              </p>
            )}

          </section>
        ))}
      </div>
    </div>
  );
}
