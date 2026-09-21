import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Modo claro/oscuro. El diseño trae las dos versiones del login, así que el
// oscuro no es invento: es parte de lo que se dibujó.
//
// Se guarda en localStorage y no en el backend a propósito: es preferencia de
// ESTE aparato. La misma cuenta puede querer oscuro en el celular de noche y
// claro en la tablet del negocio.

type Tema = "claro" | "oscuro";

interface TemaContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const TemaContext = createContext<TemaContextValue | null>(null);
const CLAVE = "scild:tema";

function temaGuardado(): Tema {
  try {
    const v = localStorage.getItem(CLAVE);
    if (v === "claro" || v === "oscuro") return v;
    // Sin preferencia guardada, se respeta la del sistema.
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
  } catch {
    // Ventana privada o almacenamiento bloqueado: claro y a seguir.
    return "claro";
  }
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaGuardado);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try {
      localStorage.setItem(CLAVE, tema);
    } catch {
      /* que no se guarde no es motivo para romper la pantalla */
    }
  }, [tema]);

  return (
    <TemaContext.Provider
      value={{ tema, alternarTema: () => setTema((t) => (t === "claro" ? "oscuro" : "claro")) }}
    >
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const c = useContext(TemaContext);
  if (!c) throw new Error("useTema debe usarse dentro de un TemaProvider");
  return c;
}
