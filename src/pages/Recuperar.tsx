import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CampoCorreo from "../components/CampoCorreo";

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
      // cualquiera podría averiguar quién tiene cuenta con solo teclear
      // correos. Un correo mal escrito sí se avisa, porque ahí el error es
      // del dedo y no hay nada que revelar.
      if (codigo === "auth/invalid-email") {
        setError("El correo no es válido.");
      } else if (codigo === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
      } else {
        setEnviado(true);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-semibold text-slate-900">Recuperar contraseña</h1>

        {enviado ? (
          <>
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">
              Si hay una cuenta con ese correo, ya va en camino un mensaje con el enlace para
              poner una contraseña nueva.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Revisa también la carpeta de correo no deseado. El enlace caduca, así que úsalo
              pronto.
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Escribe tu correo y te mandamos un enlace para cambiarla.
            </p>

            <form onSubmit={manejarEnvio} className="mt-6 space-y-4">
              <CampoCorreo id="email" value={email} onChange={setEmail} />

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {enviando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-red-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
