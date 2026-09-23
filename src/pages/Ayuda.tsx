import { useState } from "react";
import Pantalla from "../components/Pantalla";
import GuiaBienvenida from "../components/GuiaBienvenida";
import { CONTACTO, SECCIONES_AYUDA, type Pregunta } from "../data/ayuda";

function Respuesta({ pregunta }: { pregunta: Pregunta }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <li className="border-b-2 last:border-0" style={{ borderColor: "var(--borde-tenue)" }}>
      <button
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-bold" style={{ color: "var(--texto)" }}>
          {pregunta.pregunta}
        </span>
        <span
          className={`shrink-0 text-lg leading-none transition-transform ${abierta ? "rotate-180" : ""}`}
          style={{ color: "var(--texto-tenue)" }}
          aria-hidden
        >
          ⌄
        </span>
      </button>

      {abierta && (
        <div className="pb-3 text-sm leading-relaxed" style={{ color: "var(--texto-tenue)" }}>
          {pregunta.pendiente ? (
            <p className="rounded-xl px-3 py-2" style={{ background: "var(--superficie-suave)" }}>
              Estamos preparando esta información. Mientras tanto, escríbenos y te ayudamos.
            </p>
          ) : (
            pregunta.respuesta.map((parrafo, i) => (
              <p key={i} className="mt-1 first:mt-0">
                {parrafo}
              </p>
            ))
          )}
        </div>
      )}
    </li>
  );
}

// Apartado de ayuda. El contenido vive en src/data/ayuda.ts para poder
// agregar respuestas sin tocar esta pantalla.
export default function Ayuda() {
  const [guia, setGuia] = useState(false);
  const hayContacto = CONTACTO.telefono || CONTACTO.correo;

  return (
    <>
      {guia && <GuiaBienvenida alCerrar={() => setGuia(false)} />}
      <Pantalla titulo="Ayuda" subtitulo="Tu botón, tus alertas y tu cuenta">
        {/* La guía del primer día, para volver a verla cuando haga falta. */}
        <button
          type="button"
          onClick={() => setGuia(true)}
          className="tarjeta mb-4 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
              Cómo funciona SCILD
            </span>
            <span className="block text-xs" style={{ color: "var(--texto-tenue)" }}>
              La guía rápida, en cinco pasos
            </span>
          </span>
          <span className="shrink-0 text-xl" style={{ color: "var(--texto)" }} aria-hidden>
            →
          </span>
        </button>

        <div className="space-y-3">
          {SECCIONES_AYUDA.map((seccion) => (
            <section key={seccion.id} className="tarjeta px-4 py-2">
              <h2
                className="pt-2 text-xs font-bold uppercase tracking-wide"
                style={{ color: "var(--texto-tenue)" }}
              >
                {seccion.titulo}
              </h2>
              <ul>
                {seccion.preguntas.map((p) => (
                  <Respuesta key={p.id} pregunta={p} />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="tarjeta mt-3 p-4">
          <h2 className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
            ¿Sigues con el problema?
          </h2>
          {hayContacto ? (
            <div className="mt-2 space-y-1 text-sm" style={{ color: "var(--texto-tenue)" }}>
              {CONTACTO.telefono && (
                <p>
                  Teléfono:{" "}
                  <a href={`tel:${CONTACTO.telefono}`} className="font-bold underline" style={{ color: "var(--texto)" }}>
                    {CONTACTO.telefono}
                  </a>
                </p>
              )}
              {CONTACTO.correo && (
                <p>
                  Correo:{" "}
                  <a href={`mailto:${CONTACTO.correo}`} className="font-bold underline" style={{ color: "var(--texto)" }}>
                    {CONTACTO.correo}
                  </a>
                </p>
              )}
              {CONTACTO.horario && <p>{CONTACTO.horario}</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm" style={{ color: "var(--texto-tenue)" }}>
              Aquí van el teléfono y el correo de soporte. Se configuran en{" "}
              <code className="rounded px-1 text-xs" style={{ background: "var(--superficie-suave)" }}>
                src/data/ayuda.ts
              </code>
              .
            </p>
          )}
        </section>

        <p
          className="mt-3 rounded-2xl px-4 py-3 text-center text-sm font-bold"
          style={{ background: "var(--peligro)", color: "#fff" }}
        >
          Si estás en una emergencia real, no esperes soporte: usa el botón SOS de tu grupo y llama
          al 911.
        </p>
      </Pantalla>
    </>
  );
}
