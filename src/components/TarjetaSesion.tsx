import type { ReactNode } from "react";

// La tarjeta del login del diseño: degradado de gris a negro, esquinas muy
// redondeadas y todo el texto en blanco. La usan Iniciar sesión, Crear cuenta
// y Recuperar contraseña, para que las tres se vean de la misma familia.
//
// El degradado va en línea y no en una clase de Tailwind porque sus dos
// extremos son variables del tema: en oscuro arranca más abajo para que no
// deslumbre de noche.

export default function TarjetaSesion({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-8" style={{ background: "var(--fondo)" }}>
      <div
        className="w-full max-w-sm rounded-[2.5rem] px-7 py-8 text-white shadow-2xl"
        style={{
          background: "linear-gradient(to bottom, var(--login-de) 0%, var(--login-a) 78%)",
          boxShadow: "0 10px 30px var(--sombra)",
        }}
      >
        <h1 className="text-2xl font-extrabold uppercase tracking-tight">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-white/80">{subtitulo}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// Campo con la etiqueta encima y el recuadro claro con contorno negro, tal
// como se dibujó. Se exporta aquí para que las tres pantallas de sesión no
// repitan los mismos estilos.
export function CampoSesion({
  id,
  etiqueta,
  children,
}: {
  id: string;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-white/90">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

export const CLASE_CAMPO_SESION =
  "w-full rounded-md border-2 border-black bg-[#c7d0d9] px-3 py-2.5 text-sm text-black outline-none focus:ring-2 focus:ring-white/70";

// El botón principal: pastilla muy oscura con borde blanco y texto en
// mayúsculas. En el diseño es lo único que invita a tocar en toda la tarjeta.
export const CLASE_BOTON_SESION =
  "w-full rounded-full border-2 border-white bg-[#1b0f0f] py-3 text-base font-extrabold uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-60";
