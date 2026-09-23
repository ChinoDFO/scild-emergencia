import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import { obtenerAcceso, vincularCodigo, type Acceso } from "../services/api";

// Apartado de Códigos: es donde una cuenta pasa de invitada a poder alertar.
//
// Quien compra un botón captura aquí (o al registrarse) el código impreso en
// su caja. El mismo código vale para tres personas, porque el botón es del
// lugar y no de alguien: quienes viven o trabajan ahí. Los demás del grupo
// entran como invitados y ahí se quedan — el permiso no se presta ni se
// compra.

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
    <Pantalla titulo="Códigos" subtitulo="Vincula tu botón a esta cuenta">
      {acceso && (
        <div
          className="tarjeta mb-4 px-4 py-3 text-sm"
          style={{
            background: acceso.completo ? "var(--superficie)" : "var(--superficie-suave)",
            color: "var(--texto)",
          }}
        >
          <p className="font-bold uppercase">
            {acceso.completo ? "Cuenta verificada" : "Cuenta de invitado"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--texto-tenue)" }}>
            {acceso.completo
              ? "Tu cuenta está vinculada a un botón: puedes enviar alertas en todos tus grupos."
              : "Puedes leer y escribir en el chat de tus grupos, pero no enviar alertas. Captura el código de tu botón aquí abajo."}
          </p>
        </div>
      )}

      <form onSubmit={confirmar} className="tarjeta p-4">
        <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
          Código del botón
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="ABC-DEF-GHJ"
            autoCapitalize="characters"
            autoComplete="off"
            className="mt-1 w-full rounded-xl border-2 px-3 py-2.5 text-center font-mono text-lg uppercase tracking-widest outline-none"
            style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
          />
        </label>
        <p className="mt-1 text-xs" style={{ color: "var(--texto-tenue)" }}>
          Viene impreso en la caja. Sirve para tres personas: las que viven o trabajan donde está
          el botón.
        </p>

        {error && (
          <p
            className="mt-3 rounded-xl px-3 py-2 text-sm"
            style={{ background: "var(--fondo)", color: "var(--peligro)" }}
          >
            {error}
          </p>
        )}
        {listo && (
          <p
            className="mt-3 rounded-xl px-3 py-2 text-sm font-bold"
            style={{ background: "var(--fondo)", color: "var(--texto)" }}
          >
            {listo}
          </p>
        )}

        <button
          type="submit"
          disabled={vinculando || codigo.trim().length === 0}
          className="mt-3 w-full rounded-full py-2.5 text-sm font-bold uppercase disabled:opacity-50"
          style={{ background: "var(--texto)", color: "var(--fondo)" }}
        >
          {vinculando ? "Confirmando…" : "Confirmar"}
        </button>
      </form>

      {/* --- Tus botones --- */}
      {acceso?.botones.map((b) => (
        <section key={b.id} className="tarjeta mt-3 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
              {b.nombre}
            </h2>
            <span className="text-xs" style={{ color: "var(--texto-tenue)" }}>
              {b.grupo ? b.grupo.name : "Sin grupo"}
            </span>
          </div>

          <p className="mt-1 text-xs" style={{ color: "var(--texto-tenue)" }}>
            Titulares ({b.titulares.length} de 3): {b.titulares.map((t) => t.nombre).join(", ")}
          </p>

          {b.titulares.length >= 3 && (
            <p
              className="mt-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: "var(--fondo)", color: "var(--texto-tenue)" }}
            >
              Este botón ya tiene sus tres titulares. Ese número no se amplía: el código de la caja
              vale exactamente tres veces, siempre. Los demás del grupo entran como invitados y
              participan en el chat, pero no envían alertas; para poder hacerlo necesitan su propio
              botón.
            </p>
          )}
        </section>
      ))}
    </Pantalla>
  );
}
