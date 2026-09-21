import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import BarraBusqueda from "../components/BarraBusqueda";
import EliminarCuenta from "../components/EliminarCuenta";
import Notificaciones from "../components/Notificaciones";
import { useAuth } from "../context/AuthContext";
import { useTema } from "../context/TemaContext";
import { obtenerPerfil, type Perfil } from "../services/api";

// La lista de pills del diseño. El buscador de arriba filtra las opciones:
// son once y con el teclado abierto no caben en una pantalla de celular.
//
// Las que todavía no tienen a dónde ir se muestran igual, pero deshabilitadas
// y diciendo por qué. Esconderlas daría la impresión de que no están
// planeadas; dejarlas activas sin función sería peor.

interface Opcion {
  texto: string;
  alTocar?: () => void;
  detalle?: string;
  desactivada?: string;
  peligro?: boolean;
}

export default function Configuracion() {
  const navigate = useNavigate();
  const { cerrarSesion, usuario } = useAuth();
  const { tema, alternarTema } = useTema();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [panel, setPanel] = useState<"notificaciones" | "eliminar" | null>(null);

  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch(() => setPerfil(null));
  }, []);

  const opciones: Opcion[] = useMemo(
    () => [
      {
        texto: "Modo claro/oscuro",
        detalle: tema === "oscuro" ? "Oscuro" : "Claro",
        alTocar: alternarTema,
      },
      {
        texto: "Cambiar correo",
        // Cambiar el correo es de Firebase Auth y pide volver a autenticarse;
        // además dejaría la fila de Postgres apuntando al correo viejo.
        desactivada: "Todavía no: hay que reautenticar la sesión",
      },
      {
        texto: "Cambiar ubicación",
        detalle: "La dirección vive en cada grupo",
        alTocar: () => navigate("/grupos"),
      },
      { texto: "Ayuda", alTocar: () => navigate("/ayuda") },
      {
        texto: "Página web",
        alTocar: () => window.open("https://scild.mx", "_blank", "noopener"),
      },
      {
        texto: "Tipo y tamaño de letra",
        desactivada: "Pendiente de definir la escala tipográfica",
      },
      {
        texto: "Desvincular botón",
        detalle: "Desde Códigos",
        alTocar: () => navigate("/codigos"),
      },
      {
        texto: "Control de notificaciones",
        alTocar: () => setPanel((p) => (p === "notificaciones" ? null : "notificaciones")),
      },
      ...(perfil?.esAdminPlataforma
        ? [{ texto: "Panel de administración", alTocar: () => navigate("/admin") }]
        : []),
      { texto: "Cambiar/cerrar sesión", alTocar: () => void cerrarSesion() },
      {
        texto: "Eliminar cuenta",
        peligro: true,
        alTocar: () => setPanel((p) => (p === "eliminar" ? null : "eliminar")),
      },
    ],
    [tema, alternarTema, navigate, cerrarSesion, perfil]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? opciones.filter((o) => o.texto.toLowerCase().includes(q)) : opciones;
  }, [opciones, busqueda]);

  return (
    <Pantalla titulo="Configuración" subtitulo="Personaliza la vista de tu app o edita tu información">
      <BarraBusqueda valor={busqueda} alCambiar={setBusqueda} placeholder="Buscar" />

      <ul className="space-y-3">
        {visibles.map((o) => (
          <li key={o.texto}>
            <button
              type="button"
              onClick={o.alTocar}
              disabled={!o.alTocar}
              title={o.desactivada}
              className="pieza flex w-full items-center justify-between gap-3 px-5 py-3 text-left disabled:opacity-50"
              style={{ color: o.peligro ? "var(--peligro)" : "var(--texto)" }}
            >
              {/* El nombre de la opción nunca se parte: es lo que se busca con
                  la vista. La nota de la derecha sí se recorta si no cabe. */}
              <span className="shrink-0 whitespace-nowrap text-sm font-bold uppercase">{o.texto}</span>
              {(o.detalle || o.desactivada) && (
                <span className="min-w-0 truncate text-right text-[10px] normal-case" style={{ color: "var(--texto-tenue)" }}>
                  {o.detalle ?? o.desactivada}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {panel === "notificaciones" && (
        <div className="tarjeta mt-4 p-4">
          <Notificaciones />
        </div>
      )}

      {panel === "eliminar" && usuario?.email && (
        <div className="tarjeta mt-4 p-4">
          <EliminarCuenta email={usuario.email} />
        </div>
      )}
    </Pantalla>
  );
}
