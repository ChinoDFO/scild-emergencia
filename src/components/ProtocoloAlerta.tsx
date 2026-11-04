import type { TipoAlerta } from "../services/api";

interface Props {
  tipo: TipoAlerta;
}

// "Qué hacer" plegable dentro de la propia alerta: un push no tiene espacio
// para un protocolo completo, así que vive aquí, donde de verdad hace falta
// leerlo. Colapsado por default para no saturar la tarjeta; <details> no
// necesita estado propio ni JS.
export default function ProtocoloAlerta({ tipo }: Props) {
  return (
    <details className="mt-1.5">
      <summary
        className="cursor-pointer select-none text-[11px] font-bold uppercase"
        style={{ color: "var(--texto-tenue)" }}
      >
        Qué hacer
      </summary>
      <div
        className="mt-1.5 space-y-2 rounded-lg p-2.5 text-[11px] leading-snug"
        style={{ background: "var(--superficie-suave)" }}
      >
        <ul className="space-y-1">
          {tipo.protocolo.hacer.map((item, i) => (
            <li key={i} className="flex gap-1.5" style={{ color: "var(--texto)" }}>
              <span aria-hidden>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-1">
          {tipo.protocolo.noHacer.map((item, i) => (
            <li key={i} className="flex gap-1.5" style={{ color: "var(--peligro)" }}>
              <span aria-hidden>✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
