// La barra de búsqueda del diseño: pill gris-azul con la lupa a la izquierda.
// Aparece en Grupos, Dispositivos y Configuración con distinto texto.

interface Props {
  valor: string;
  alCambiar: (v: string) => void;
  placeholder: string;
}

export default function BarraBusqueda({ valor, alCambiar, placeholder }: Props) {
  return (
    <div className="pieza mb-3 flex items-center gap-2 px-4 py-2.5">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="var(--texto)" strokeWidth={2.5} aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm uppercase tracking-wide outline-none placeholder:normal-case"
        style={{ color: "var(--texto)" }}
      />
    </div>
  );
}
