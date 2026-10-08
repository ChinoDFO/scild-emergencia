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
import {
  activarNotificaciones,
  desactivarNotificaciones,
  esAppNativaAndroid,
  estadoNotificaciones,
  registrarTokenNativoSiHayUno,
} from "../services/notificaciones";
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

// Registra este navegador para recibir avisos, si el permiso YA está dado.
//
// El permiso de notificaciones es del navegador y dura más que la cuenta:
// sigue concedido después de eliminar una cuenta y registrar otra, o de
// entrar con otra persona en el mismo equipo. Pero el registro en el servidor
// (a dónde mandarle el aviso a ESTA cuenta) no viaja con el permiso. Antes
// solo se hacía al abrir Configuración → Control de notificaciones, así que
// una cuenta que nunca abría ese panel se quedaba sin avisos aunque el
// navegador dijera "activadas".
//
// Como el permiso ya está dado no abre ningún diálogo, y repetirlo es
// inofensivo (el servidor hace upsert). Si el permiso no está dado, no hace
// nada: pedirlo sigue siendo decisión de la persona, desde el panel.
function registrarNotificacionesSiYaHayPermiso() {
  // Dentro de la app de Android empaquetada el push nativo no pasa por el
  // permiso de notificaciones del navegador ni por getToken: ver
  // registrarTokenNativoSiHayUno en notificaciones.ts.
  if (esAppNativaAndroid) {
    registrarTokenNativoSiHayUno();
    return;
  }

  estadoNotificaciones()
    .then((estado) => (estado === "activadas" ? activarNotificaciones() : undefined))
    .catch((e) => console.warn("No se pudo registrar el dispositivo para avisos:", e));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUsuario(u);
      setCargando(false);
      if (u) registrarNotificacionesSiYaHayPermiso();
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
