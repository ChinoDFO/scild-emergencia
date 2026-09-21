import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TarjetaSesion, {
  CampoSesion,
  CLASE_BOTON_SESION,
  CLASE_CAMPO_SESION,
} from "../components/TarjetaSesion";

export default function Recuperar() {
  const { recuperarContrasena } = useAuth();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await recuperarContrasena(email.trim());
      setEnviado(true);
    } catch (err) {
      const codigo = (err as { code?: string }).code ?? "";
      // A propósito NO se distingue "ese correo no existe": si lo dijéramos,
      // cualquiera podría averiguar quién tiene cuenta tecleando correos.
      if (codigo === "auth/invalid-email") setError("El correo no es válido.");
      else if (codigo === "auth/too-many-requests")
        setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
      else setEnviado(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TarjetaSesion
      titulo="Recuperar contraseña"
      subtitulo={enviado ? undefined : "Te mandamos un enlace para cambiarla"}
    >
      {enviado ? (
        <>
          <p className="rounded-xl bg-white/15 px-4 py-3 text-sm text-white">
            Si hay una cuenta con ese correo, ya va en camino un mensaje con el enlace para poner
            una contraseña nueva.
          </p>
          <p className="text-xs text-white/70">
            Revisa también la carpeta de correo no deseado. El enlace caduca, así que úsalo pronto.
          </p>
        </>
      ) : (
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
          {error && (
            <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-900">{error}</p>
          )}
          <button type="submit" disabled={enviando} className={CLASE_BOTON_SESION}>
            {enviando ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}

      <p className="pt-1 text-center text-sm">
        <Link to="/login" className="font-bold text-white hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </TarjetaSesion>
  );
}
