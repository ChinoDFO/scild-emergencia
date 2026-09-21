import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { actualizarApodo } from "../services/api";
import { desactivarNotificaciones } from "../services/notificaciones";
import { desconectarTiempoReal } from "../services/tiempoReal";

interface AuthContextValue {
  usuario: User | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string, apodo: string) => Promise<void>;
  recuperarContrasena: (email: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUsuario(u);
      setCargando(false);
    });
  }, []);

  const iniciarSesion = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registrarse = async (email: string, password: string, apodo: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
    // La cuenta ya existe aunque esto falle: no se le bloquea la entrada, y
    // Inicio le vuelve a pedir el apodo si se quedó sin él.
    try {
      await actualizarApodo(apodo);
    } catch (e) {
      console.warn("No se pudo guardar el apodo al registrarse:", e);
    }
  };

  // Firebase manda el correo con el enlace para poner una contraseña nueva;
  // el backend no se entera ni tiene por qué. Quien llame a esto NO debe
  // distinguir si el correo existía: ver abajo, en la pantalla.
  const recuperarContrasena = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // El token de push se borra ANTES de cerrar la sesión: desregistrarlo
  // requiere el token de Firebase del usuario actual, y en un equipo
  // compartido el siguiente en entrar no debe heredar sus alertas.
  const cerrarSesion = async () => {
    await desactivarNotificaciones();
    desconectarTiempoReal();
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        registrarse,
        recuperarContrasena,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
