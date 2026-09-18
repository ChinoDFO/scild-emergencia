import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { crearGrupo, unirseAGrupo } from "../services/api";

const CLASE_INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500";

// Crear un establecimiento (quien lo crea queda como ADMIN) o unirse a uno
// existente con el código que comparte su ADMIN.
export default function GestionGrupos() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"unirse" | "crear">("unirse");
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const groupId =
        modo === "unirse"
          ? (await unirseAGrupo(codigo)).groupId
          : (await crearGrupo({ name: nombre, address: direccion })).id;
      navigate(`/grupos/${groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar");
    } finally {
      setEnviando(false);
    }
  }

  const pestana = (valor: typeof modo, texto: string) => (
    <button
      type="button"
      onClick={() => {
        setModo(valor);
        setError(null);
      }}
      className={`flex-1 rounded-md py-1.5 text-sm font-medium ${
        modo === valor ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
      }`}
    >
      {texto}
    </button>
  );

  return (
    <div className="mt-3">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {pestana("unirse", "Unirme con código")}
        {pestana("crear", "Crear establecimiento")}
      </div>

      <form onSubmit={manejarEnvio} className="mt-3 space-y-3">
        {modo === "unirse" ? (
          <input
            required
            placeholder="Código de invitación (ej. 3FA9C1B20D7E)"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoCapitalize="characters"
            className={`${CLASE_INPUT} font-mono uppercase`}
          />
        ) : (
          <>
            <input
              required
              maxLength={80}
              placeholder="Nombre (ej. Abarrotes Flores, Casa)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={CLASE_INPUT}
            />
            <input
              required
              maxLength={200}
              placeholder="Dirección: calle, número, colonia, ciudad"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={CLASE_INPUT}
            />
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {enviando ? "Un momento…" : modo === "unirse" ? "Unirme" : "Crear"}
        </button>
      </form>
    </div>
  );
}
