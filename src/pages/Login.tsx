import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CampoContrasena from "../components/CampoContrasena";
import CampoCorreo from "../components/CampoCorreo";

function mensajeError(codigo: string): string {
  switch (codigo) {
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No se pudo iniciar sesión. Intenta de nuevo.";
  }
}

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const codigo = (err as { code?: string }).code ?? "";
      setError(mensajeError(codigo));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-slate-500">
          Accede al panel de tu botón de emergencia.
        </p>

        <form onSubmit={manejarEnvio} className="mt-6 space-y-4">
          <CampoCorreo id="email" value={email} onChange={setEmail} />

          <div>
            <CampoContrasena
              id="password"
              label="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
            <p className="mt-1 text-right">
              <Link to="/recuperar" className="text-xs text-slate-500 hover:text-red-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-red-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
