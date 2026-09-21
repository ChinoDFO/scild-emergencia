import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { vincularCodigo } from "../services/api";
import TarjetaSesion, {
  CampoSesion,
  CLASE_BOTON_SESION,
  CLASE_CAMPO_SESION,
} from "../components/TarjetaSesion";
import CampoContrasena from "../components/CampoContrasena";

function mensajeError(codigo: string): string {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    default:
      return "No se pudo crear la cuenta. Intenta de nuevo.";
  }
}

export default function Registro() {
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [apodo, setApodo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    try {
      await registrarse(email, password, apodo.trim());
    } catch (err) {
      setError(mensajeError((err as { code?: string }).code ?? ""));
      setEnviando(false);
      return;
    }

    // La cuenta ya existe y la sesión está abierta. Si el código falla (mal
    // tecleado, ya usado dos veces), la cuenta NO se deshace: se manda a
    // Códigos con el motivo, para que lo intente ahí sin volver a
    // registrarse. Sin código, la cuenta entra como invitada.
    if (codigo.trim()) {
      try {
        await vincularCodigo(codigo);
      } catch (err) {
        navigate("/codigos", {
          replace: true,
          state: { error: err instanceof Error ? err.message : "No se pudo vincular el código" },
        });
        return;
      }
    }

    navigate("/", { replace: true });
    setEnviando(false);
  }

  return (
    <TarjetaSesion titulo="Crear cuenta" subtitulo="Regístrate para gestionar tu botón de emergencia">
      <form onSubmit={manejarEnvio} className="space-y-4">
        <CampoSesion id="apodo" etiqueta="¿Cómo te van a ver en tu grupo?">
          <input
            id="apodo"
            type="text"
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder="Ej. Mamá, Papá, Juan, Cajero"
            value={apodo}
            onChange={(e) => setApodo(e.target.value)}
            className={CLASE_CAMPO_SESION}
          />
        </CampoSesion>

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

        <div className="[&_label]:text-white/90 [&_input]:border-2 [&_input]:border-black [&_input]:bg-[#c7d0d9] [&_input]:text-black [&_button]:text-black">
          <CampoContrasena
            id="password"
            label="Contraseña"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={6}
          />
          <div className="mt-4">
            <CampoContrasena
              id="confirmacion"
              label="Confirmar contraseña"
              value={confirmacion}
              onChange={setConfirmacion}
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        </div>

        <CampoSesion id="codigo" etiqueta="Código del botón (opcional)">
          <input
            id="codigo"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="ABC-DEF-GHJ"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={`${CLASE_CAMPO_SESION} font-mono uppercase tracking-wider`}
          />
          <p className="mt-1 text-[11px] text-white/70">
            Viene impreso en la caja de tu botón y sirve para dos personas. Sin él puedes entrar a
            grupos y escribir en el chat, pero no enviar alertas.
          </p>
        </CampoSesion>

        {error && (
          <p className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-900">{error}</p>
        )}

        <button type="submit" disabled={enviando} className={CLASE_BOTON_SESION}>
          {enviando ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="pt-1 text-center text-sm text-white">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-bold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </TarjetaSesion>
  );
}
