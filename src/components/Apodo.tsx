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
      <p className="text-sm text-slate-500">
        En tus grupos te ven como <span className="font-medium text-slate-800">{apodo}</span>{" "}
        <button
          onClick={() => {
            setValor(apodo ?? "");
            setEditando(true);
          }}
          className="font-medium text-red-600 hover:underline"
        >
          Cambiar
        </button>
      </p>
    );
  }

  return (
    <form
      onSubmit={guardar}
      className={`rounded-lg p-3 text-sm ${apodo ? "bg-slate-50" : "bg-amber-50 ring-1 ring-amber-200"}`}
    >
      <label htmlFor="apodo" className="block font-medium text-slate-800">
        {apodo ? "Tu apodo" : "¿Cómo te llamamos en tus grupos?"}
      </label>
      {!apodo && (
        <p className="mt-0.5 text-slate-600">Así sabrán quién escribe en el chat y quién envió una alerta.</p>
      )}
      <div className="mt-2 flex gap-2">
        <input
          id="apodo"
          required
          maxLength={40}
          placeholder="Ej. Mamá, Papá, Juan, Cajero"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {guardando ? "…" : "Guardar"}
        </button>
        {apodo && (
          <button type="button" onClick={() => setEditando(false)} className="px-1 text-slate-500">
            Cancelar
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-red-700">{error}</p>}
    </form>
  );
}
