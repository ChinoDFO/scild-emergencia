import { useState } from "react";

// Campo de contraseña con el ojito para verla.
//
// Va como componente y no como tres copias del mismo <input> porque son tres
// campos (entrar, crear, confirmar) y el botón tiene que quedar DENTRO del
// recuadro sin taparle el texto: eso es padding en el input más posición
// absoluta en el botón, que es justo lo que se descuadra al copiar y pegar.
//
// El botón es type="button" a propósito: dentro de un <form>, un <button> sin
// type manda el formulario, así que tocar el ojito intentaría iniciar sesión.

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
}

export default function CampoContrasena({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required = true,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // pr-10: el espacio que ocupa el botón del ojito.
          className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          // El texto del aria-label dice la ACCIÓN, no el estado: es lo que
          // anuncia un lector de pantalla al llegar al botón.
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600 focus:outline-none focus-visible:text-red-600"
        >
          {visible ? (
            // Ojo tachado: lo que se ve cuando la contraseña está a la vista.
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
