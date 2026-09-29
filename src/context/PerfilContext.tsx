import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { obtenerPerfil, type Grupo, type Perfil } from "../services/api";
import { useEventoTiempoReal } from "../services/tiempoReal";
import { useAuth } from "./AuthContext";

// El perfil (cuenta + sus grupos) se pedía por separado en Grupos, en
// Configuración, en Perfil Y en BarraInferior —que está en TODAS las
// pantallas—, así que cada navegación disparaba dos o tres veces la misma
// consulta. Con la base en el plan gratis de Neon (la primera consulta tras
// un rato sin uso tarda ~8s en despertarla, ver CONTEXTO.md) eso se sentía
// como que "todo carga lento". Aquí se pide UNA vez por sesión y se comparte.
interface PerfilContextValue {
  perfil: Perfil | null;
  cargando: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
  actualizarLocal: (cambio: (p: Perfil) => Perfil) => void;
  marcarGrupoLeido: (groupId: string) => void;
}

const PerfilContext = createContext<PerfilContextValue | null>(null);

// Aparte del provider para que useEventoTiempoReal (y el socket que abre por
// debajo) solo se toquen con sesión iniciada: antes esa conexión nacía la
// primera vez que una pantalla protegida la usaba (Grupos, Grupo...); el
// provider ahora vive arriba de todo, incluida /login, así que sin este
// montaje condicional el socket intentaría conectarse sin token desde la
// pantalla de acceso.
function SincronizadorPerfil({
  miId,
  actualizarLocal,
}: {
  miId: string | undefined;
  actualizarLocal: (cambio: (p: Perfil) => Perfil) => void;
}) {
  const cambiarGrupo = useCallback(
    (id: string, cambio: (g: Grupo) => Grupo) =>
      actualizarLocal((p) => ({ ...p, groups: p.groups.map((g) => (g.id === id ? cambio(g) : g)) })),
    [actualizarLocal]
  );

  // El socket recibe los mensajes y alertas de TODOS sus grupos, no solo del
  // que esté abierto: así el que acaba de tener actividad sube al momento en
  // la lista, sin recargar. Uno propio no suma a "sin leer".
  useEventoTiempoReal("mensaje:nuevo", (m) => {
    const propio = m.autor.id === miId;
    cambiarGrupo(m.groupId, (g) => ({
      ...g,
      ultimoMensajeEl: m.createdAt,
      sinLeer: propio ? g.sinLeer : g.sinLeer + 1,
    }));
  });

  // Una alerta nueva cuenta como un mensaje: sube el grupo y suma al globito.
  // Atender/resolver no son actividad que alguien no haya visto todavía.
  useEventoTiempoReal("alertas:cambio", ({ groupId, accion, createdAt, createdById }) => {
    if (accion !== "creada") return;
    const propia = createdById !== null && createdById === miId;
    cambiarGrupo(groupId, (g) => ({
      ...g,
      ultimoMensajeEl: createdAt,
      sinLeer: propia ? g.sinLeer : g.sinLeer + 1,
    }));
  });

  return null;
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setPerfil(await obtenerPerfil());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar tu perfil");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) {
      refrescar();
    } else {
      // Cierre de sesión, o cambio de cuenta en el mismo equipo: nadie debe
      // ver un instante los grupos de la cuenta anterior.
      setPerfil(null);
    }
  }, [usuario, refrescar]);

  const actualizarLocal = useCallback((cambio: (p: Perfil) => Perfil) => {
    setPerfil((p) => (p ? cambio(p) : p));
  }, []);

  // Se llama junto con marcarChatLeido (la API): sin esto, abrir el chat
  // dejaba en 0 el contador en el backend, pero el globito de la lista —que
  // ya no se vuelve a pedir en cada navegación— se quedaba con el número
  // viejo hasta cerrar sesión y volver a entrar.
  const marcarGrupoLeido = useCallback((groupId: string) => {
    setPerfil((p) =>
      p ? { ...p, groups: p.groups.map((g) => (g.id === groupId ? { ...g, sinLeer: 0 } : g)) } : p
    );
  }, []);

  return (
    <PerfilContext.Provider value={{ perfil, cargando, error, refrescar, actualizarLocal, marcarGrupoLeido }}>
      {usuario && <SincronizadorPerfil miId={perfil?.id} actualizarLocal={actualizarLocal} />}
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfil() {
  const context = useContext(PerfilContext);
  if (!context) {
    throw new Error("usePerfil debe usarse dentro de un PerfilProvider");
  }
  return context;
}
