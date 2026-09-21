import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { eliminarCuenta } from "../services/api";

// Borrar la cuenta. Va con confirmación escrita, como "Eliminar grupo": es
// irreversible y aquí no hay papelera de la que sacarla.
//
// Se explica lo del código de la caja porque es la razón práctica por la que
// alguien haría esto: mientras la cuenta exista ocupa uno de los dos lugares
// del botón, y nadie más puede vincularlo.

export default function EliminarCuenta({ email }: { email: string }) {
  const { cerrarSesion } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);

  const puedeBorrar = confirmacion.trim().toLowerCase() === email.toLowerCase();

  async function borrar() {
    setError(null);
    setBorrando(true);
    try {
      await eliminarCuenta();
      // La cuenta ya no existe en Firebase; cerrar sesión deja la app en el
      // login y de paso desregistra el token de push de este aparato.
      await cerrarSesion();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta");
      setBorrando(false);
    }
  }

  if (!abierto) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={() => setAbierto(true)}
          className="text-sm font-medium text-slate-400 hover:text-red-600"
        >
          Eliminar mi cuenta
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <h2 className="text-sm font-medium text-red-700">Eliminar mi cuenta</h2>
      <div className="mt-2 space-y-2 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-900">
        <p>Esto no se puede deshacer. Al borrarla:</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>
            <strong>Se libera tu lugar en el código de la caja</strong>, y otra persona ya puede
            vincular ese botón.
          </li>
          <li>Sales de todos tus grupos y se borran tus mensajes del chat.</li>
          <li>El botón físico no se borra, y las alertas que enviaste se quedan en el historial.</li>
        </ul>
      </div>

      <label className="mt-3 block text-sm text-slate-700">
        Escribe <span className="font-mono font-medium">{email}</span> para confirmar:
        <input
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </label>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={borrar}
          disabled={!puedeBorrar || borrando}
          className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {borrando ? "Eliminando…" : "Eliminar mi cuenta"}
        </button>
        <button
          onClick={() => {
            setAbierto(false);
            setConfirmacion("");
            setError(null);
          }}
          className="flex-1 rounded-lg bg-white py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
