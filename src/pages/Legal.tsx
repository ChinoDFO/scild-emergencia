import { useState } from "react";
import Pantalla from "../components/Pantalla";
import ContenidoLegal from "../components/ContenidoLegal";
import { PRIVACIDAD, TERMINOS, VERSION_TERMINOS } from "../data/legal";

type Pestana = "terminos" | "privacidad";

// Para revisar los Términos y el Aviso de Privacidad cuando quieras, desde
// Configuración. La aceptación en sí (obligatoria una sola vez) vive en
// components/TerminosPendientes.tsx.
export default function Legal() {
  const [pestana, setPestana] = useState<Pestana>("terminos");

  const pestanas: { id: Pestana; etiqueta: string }[] = [
    { id: "terminos", etiqueta: "Términos y condiciones" },
    { id: "privacidad", etiqueta: "Aviso de privacidad" },
  ];

  return (
    <Pantalla titulo="Legal" subtitulo={`Vigentes desde el ${VERSION_TERMINOS}`}>
      <div className="tarjeta mb-4 flex p-1">
        {pestanas.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            aria-pressed={pestana === p.id}
            className="flex-1 rounded-xl py-2 text-[11px] font-bold uppercase transition"
            style={{
              background: pestana === p.id ? "var(--texto)" : "transparent",
              color: pestana === p.id ? "var(--fondo)" : "var(--texto-tenue)",
            }}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      <div className="tarjeta p-4">
        <ContenidoLegal secciones={pestana === "terminos" ? TERMINOS : PRIVACIDAD} />
      </div>
    </Pantalla>
  );
}
