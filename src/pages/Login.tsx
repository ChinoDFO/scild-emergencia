import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TarjetaSesion, {
  CampoSesion,
  CLASE_BOTON_SESION,
  CLASE_CAMPO_SESION,
} from "../components/TarjetaSesion";

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
  const [visible, setVisible] = useState(false);
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
      setError(mensajeError((err as { code?: string }).code ?? ""));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TarjetaSesion titulo="Iniciar sesión" subtitulo="Accede al panel de tu botón de emergencia">
      <form onSubmit={manejarEnvio} className="space-y-4">
        <CampoSesion id="email" etiqueta="Correo">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASE_CAMPO_SESION}
          />
        </CampoSesion>

        <CampoSesion id="password" etiqueta="Contraseña">
          <div className="relative">
            <input
              id="password"
              type={visible ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${CLASE_CAMPO_SESION} pr-11`}
            />
            {/* El ojito va dentro del recuadro, como en el diseño. */}
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={visible}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-black"
            >
              {visible ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8" />
                  <path strokeLinecap="round" d="M6.5 6.8C4.6 8.1 3.1 9.9 2.3 12c1.6 4 5.4 6.5 9.7 6.5 1.5 0 2.9-.3 4.2-.8M17.9 17c1.8-1.3 3.2-3 3.8-5-1.6-4-5.4-6.5-9.7-6.5-.8 0-1.6.1-2.3.3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path d="M2.3 12C3.9 8 7.7 5.5 12 5.5S20.1 8 21.7 12c-1.6 4-5.4 6.5-9.7 6.5S3.9 16 2.3 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1 text-right">
            <Link to="/recuperar" className="text-[11px] text-white/80 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </CampoSesion>

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-900">{error}</p>
        )}

        <button type="submit" disabled={enviando} className={CLASE_BOTON_SESION}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <div className="space-y-2 pt-1 text-center text-sm text-white">
        <p>
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-bold hover:underline">
            Regístrate
          </Link>
        </p>
        {/* El diseño manda a la tienda a quien todavía no compró el aparato. */}
        <p>
          ¿No tienes botón?{" "}
          <a href="https://scild.mx" target="_blank" rel="noreferrer" className="font-bold hover:underline">
            Pide uno en nuestra web
          </a>
        </p>
      </div>
    </TarjetaSesion>
  );
}
