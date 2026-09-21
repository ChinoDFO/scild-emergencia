// El campo de correo, igual en las tres pantallas de la sesión. Aquí no hay
// nada que decidir: existe para que el recuadro, el foco rojo y el
// autoComplete no se vayan separando entre pantallas al editar una sola.

interface Props {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  label?: string;
}

export default function CampoCorreo({ id, value, onChange, label = "Correo" }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
      />
    </div>
  );
}
