import { useTema } from "../context/TemaContext";

// Pantalla de carga: el logo de SCILD "respirando" mientras se resuelve la
// sesión (ver RutaProtegida.tsx). Dos versiones del logo, igual que el
// login: blanco para el tema oscuro, negro para el claro — cada uno pensado
// para su fondo, no es el mismo archivo invertido con CSS.
export default function Splash() {
  const { tema } = useTema();
  const logo = tema === "oscuro" ? "/logo-oscuro.png" : "/logo-claro.png";

  return (
    <div
      className="flex min-h-svh items-center justify-center"
      style={{ background: "var(--fondo)" }}
      role="status"
      aria-label="Cargando SCILD"
    >
      <img
        src={logo}
        alt=""
        aria-hidden
        className="h-32 w-32 motion-safe:animate-[pulso-logo_1.8s_ease-in-out_infinite]"
      />
    </div>
  );
}
