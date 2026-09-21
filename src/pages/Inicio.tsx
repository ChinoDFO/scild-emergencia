import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Apodo from "../components/Apodo";
import EliminarCuenta from "../components/EliminarCuenta";
import GestionGrupos from "../components/GestionGrupos";
import ListaAlertas from "../components/ListaAlertas";
import Notificaciones from "../components/Notificaciones";
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
          <div className="flex items-center gap-4">
            {perfil?.esAdminPlataforma && (
              <Link to="/admin" className="text-sm font-medium text-red-600 hover:underline">
                Admin
              </Link>
            )}
            <Link to="/codigos" className="text-sm font-medium text-slate-500 hover:text-red-600">
              Códigos
            </Link>
            <Link to="/ayuda" className="text-sm font-medium text-slate-500 hover:text-red-600">
              Ayuda
            </Link>
            <button
              onClick={cerrarSesion}
              className="text-sm font-medium text-slate-500 hover:text-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Sesión de Firebase: <span className="text-slate-800">{usuario?.email}</span>
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            No se pudo cargar tu perfil del servidor: {error}
          </p>
        )}

        {perfil && !perfil.accesoCompleto && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tu cuenta es de invitado: puedes escribir en el chat de tus grupos, pero no enviar
            alertas.{" "}
            <Link to="/codigos" className="font-medium underline">
              Captura el código de tu botón
            </Link>
            .
          </p>
        )}

        {perfil && (
          <div className="mt-4 space-y-3">
            <Apodo
              apodo={perfil.displayName}
              alCambiar={(displayName) => setPerfil({ ...perfil, displayName })}
            />

            <div>
              <h2 className="text-sm font-medium text-slate-700">Tus grupos</h2>
              {perfil.groups.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400">
                  Aún no perteneces a ningún grupo.
                </p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {perfil.groups.map((g) => (
                    <li key={g.id}>
                      <Link
                        to={`/grupos/${g.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        <span className="truncate">{g.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {g.sinLeer > 0 && (
                            <span
                              className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white"
                              aria-label={`${g.sinLeer} mensajes sin leer`}
                            >
                              {g.sinLeer > 99 ? "99+" : g.sinLeer}
                            </span>
                          )}
                          <span className="text-xs uppercase text-slate-400">{g.role} →</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <GestionGrupos />
            </div>

            {perfil.groups.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-medium text-slate-700">Alertas abiertas</h2>
                <ListaAlertas soloAbiertas mostrarGrupo vacio="Todo en calma: no hay alertas abiertas." />
              </div>
            )}
          </div>
        )}

        <Notificaciones />

        {usuario?.email && <EliminarCuenta email={usuario.email} />}
      </div>
    </div>
  );
}
