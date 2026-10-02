import { useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

// Cambiar el correo con el que se entra a la cuenta. Firebase exige una
// sesión "reciente" para esto —si no, tira auth/requires-recent-login— así
// que primero se reautentica con la contraseña actual y hasta entonces se
// pide el cambio.
//
// Se usa verifyBeforeUpdateEmail y no updateEmail: manda un enlace de
// confirmación al correo NUEVO y el cambio no se aplica hasta que se toque
// ese enlace. Así un correo mal escrito no deja a nadie fuera de su cuenta
// (con updateEmail el cambio es inmediato y sin vuelta atrás), y es el flujo
// que Firebase recomienda hoy para esto.

function mensajeError(codigo: string): string {
  switch (codigo) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Contraseña incorrecta.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/requires-recent-login":
      return "Tu sesión es muy vieja para este cambio. Cierra sesión y vuelve a entrar.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No se pudo cambiar el correo. Intenta de nuevo.";
  }
}

export default function CambiarCorreo() {
  const { usuario } = useAuth();
  const [password, setPassword] = useState("");
  const [correoNuevo, setCorreoNuevo] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const correoActual = usuario?.email ?? "";

  const coinciden = correoNuevo.trim().toLowerCase() === confirmar.trim().toLowerCase();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario || !correoActual) return;
    if (!coinciden) {
      setError("Los dos correos no coinciden.");
      return;
    }
    if (correoNuevo.trim().toLowerCase() === correoActual.toLowerCase()) {
      setError("Ese ya es tu correo actual.");
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await reauthenticateWithCredential(
        usuario,
        EmailAuthProvider.credential(correoActual, password)
      );
      await verifyBeforeUpdateEmail(usuario, correoNuevo.trim());
      setEnviado(correoNuevo.trim());
    } catch (err) {
      setError(mensajeError((err as { code?: string }).code ?? ""));
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="rounded-lg p-3 text-sm" style={{ background: "var(--superficie-suave)" }}>
        <p style={{ color: "var(--texto)" }}>
          Te mandamos un correo a <strong>{enviado}</strong> para confirmar el cambio. Sigues
          entrando con tu correo actual hasta que lo confirmes ahí.
        </p>
        <button
          type="button"
          onClick={() => {
            setEnviado(null);
            setPassword("");
            setCorreoNuevo("");
            setConfirmar("");
          }}
          className="mt-2 font-medium hover:underline"
          style={{ color: "var(--texto-tenue)" }}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-lg p-3 text-sm"
      style={{ background: "var(--superficie-suave)" }}
    >
      <p className="font-medium" style={{ color: "var(--texto)" }}>
        Correo actual: {correoActual}
      </p>

      <label className="mt-3 block font-medium" style={{ color: "var(--texto)" }}>
        Tu contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 font-normal focus:outline-none focus:ring-1"
          style={{ background: "var(--fondo)", color: "var(--texto)", borderColor: "var(--borde-tenue)" }}
        />
      </label>

      <label className="mt-3 block font-medium" style={{ color: "var(--texto)" }}>
        Correo nuevo
        <input
          type="email"
          required
          autoComplete="email"
          value={correoNuevo}
          onChange={(e) => setCorreoNuevo(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 font-normal focus:outline-none focus:ring-1"
          style={{ background: "var(--fondo)", color: "var(--texto)", borderColor: "var(--borde-tenue)" }}
        />
      </label>

      <label className="mt-3 block font-medium" style={{ color: "var(--texto)" }}>
        Confirmar correo nuevo
        <input
          type="email"
          required
          autoComplete="email"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2 font-normal focus:outline-none focus:ring-1"
          style={{ background: "var(--fondo)", color: "var(--texto)", borderColor: "var(--borde-tenue)" }}
        />
      </label>

      {error && (
        <p className="mt-3" style={{ color: "var(--peligro)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-3 rounded-lg px-3 py-2 font-medium disabled:opacity-60"
        style={{ background: "var(--texto)", color: "var(--fondo)" }}
      >
        {enviando ? "Enviando…" : "Cambiar correo"}
      </button>
    </form>
  );
}
