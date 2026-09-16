import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { obtenerPerfil, type Perfil } from "../services/api";

export default function Inicio() {
  const { usuario, cerrarSesion } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Tu cuenta</h1>
          <button
            onClick={cerrarSesion}
            className="text-sm font-medium text-slate-500 hover:text-red-600"
          >
            Cerrar sesión
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Sesión de Firebase: <span className="text-slate-800">{usuario?.email}</span>
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            No se pudo cargar tu perfil del servidor: {error}
          </p>
        )}

        {perfil && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Perfil sincronizado en el backend (id: {perfil.id}).
            </p>

            <div>
              <h2 className="text-sm font-medium text-slate-700">Tus grupos</h2>
              {perfil.groups.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400">
                  Aún no perteneces a ningún grupo.
                </p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {perfil.groups.map((g) => (
                    <li
                      key={g.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{g.name}</span>
                      <span className="text-xs uppercase text-slate-400">{g.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
