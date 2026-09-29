import type { SeccionLegal } from "../data/legal";

// Compartido entre la pantalla de Configuración (Legal.tsx) y el modal de
// aceptación (TerminosPendientes.tsx), para no mantener el mismo dibujo en
// dos lados.
export default function ContenidoLegal({ secciones }: { secciones: SeccionLegal[] }) {
  return (
    <div className="space-y-4">
      {secciones.map((s) => (
        <section key={s.id}>
          <h3 className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
            {s.titulo}
          </h3>
          <div className="mt-1 space-y-1.5 text-sm leading-relaxed" style={{ color: "var(--texto-tenue)" }}>
            {s.parrafos.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
