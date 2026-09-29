import { useState, type FormEvent } from "react";
import { actualizarApodo } from "../services/api";

interface Props {
  apodo: string | null;
  alCambiar: (nuevo: string) => void;
}

// Cómo te ven los demás en tus grupos. Si no hay (cuentas creadas antes de
// que se pidiera al registrarse), se pide de forma visible: en el chat y en
// las alertas saldría solo el correo.
export default function Apodo({ apodo, alCambiar }: Props) {
  const [editando, setEditando] = useState(!apodo);
  const [valor, setValor] = useState(apodo ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const { displayName } = await actualizarApodo(valor);
      alCambiar(displayName);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <p className="text-sm" style={{ color: "var(--texto-tenue)" }}>
        En tus grupos te ven como{" "}
        <span className="font-medium" style={{ color: "var(--texto)" }}>
          {apodo}
        </span>{" "}
        <button
          onClick={() => {
            setValor(apodo ?? "");
            setEditando(true);
          }}
          className="font-medium hover:underline"
          style={{ color: "var(--peligro)" }}
        >
          Cambiar
        </button>
      </p>
    );
  }

  return (
    <form
      onSubmit={guardar}
      className="rounded-lg p-3 text-sm"
      style={
        apodo
          ? { background: "var(--superficie-suave)" }
          : { background: "var(--superficie-suave)", boxShadow: "inset 0 0 0 1px var(--alerta)" }
      }
    >
      <label htmlFor="apodo" className="block font-medium" style={{ color: "var(--texto)" }}>
        {apodo ? "Tu apodo" : "¿Cómo te llamamos en tus grupos?"}
      </label>
      {!apodo && (
        <p className="mt-0.5" style={{ color: "var(--texto-tenue)" }}>
          Así sabrán quién escribe en el chat y quién envió una alerta.
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          id="apodo"
          required
          maxLength={40}
          placeholder="Ej. Mamá, Papá, Juan, Cajero"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-1"
          style={{
            background: "var(--fondo)",
            color: "var(--texto)",
            borderColor: "var(--borde-tenue)",
          }}
        />
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg px-3 py-2 font-medium disabled:opacity-60"
          style={{ background: "var(--texto)", color: "var(--fondo)" }}
        >
          {guardando ? "…" : "Guardar"}
        </button>
        {apodo && (
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="px-1"
            style={{ color: "var(--texto-tenue)" }}
          >
            Cancelar
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2" style={{ color: "var(--peligro)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
