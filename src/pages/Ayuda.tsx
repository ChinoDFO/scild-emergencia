import { useState } from "react";
import { Link } from "react-router-dom";
import { CONTACTO, SECCIONES_AYUDA, type Pregunta } from "../data/ayuda";

function Respuesta({ pregunta }: { pregunta: Pregunta }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <li className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="text-sm font-medium text-slate-800">{pregunta.pregunta}</span>
        <span className={`shrink-0 text-slate-400 transition-transform ${abierta ? "rotate-180" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>

      {abierta && (
        <div className="pb-3 text-sm text-slate-600">
          {pregunta.pendiente ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
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
  const hayContacto = CONTACTO.telefono || CONTACTO.correo;

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        <Link to="/" className="text-sm font-medium text-slate-500 hover:text-red-600">
          ← Volver
        </Link>

        <h1 className="mt-3 text-xl font-semibold text-slate-900">Ayuda</h1>
        <p className="mt-1 text-sm text-slate-500">
          Problemas con tu botón, con las alertas o con tu cuenta.
        </p>

        <div className="mt-5 space-y-4">
          {SECCIONES_AYUDA.map((seccion) => (
            <section key={seccion.id} className="rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-slate-200">
              <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
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

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-sm font-semibold text-slate-800">¿Sigues con el problema?</h2>
          {hayContacto ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {CONTACTO.telefono && (
                <p>
                  Teléfono:{" "}
                  <a href={`tel:${CONTACTO.telefono}`} className="font-medium text-red-600 hover:underline">
                    {CONTACTO.telefono}
                  </a>
                </p>
              )}
              {CONTACTO.correo && (
                <p>
                  Correo:{" "}
                  <a href={`mailto:${CONTACTO.correo}`} className="font-medium text-red-600 hover:underline">
                    {CONTACTO.correo}
                  </a>
                </p>
              )}
              {CONTACTO.horario && <p className="text-slate-500">{CONTACTO.horario}</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              Aquí van el teléfono y el correo de soporte. Se configuran en{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">src/data/ayuda.ts</code>.
            </p>
          )}
        </section>

        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-800">
          Si estás en una emergencia real, no esperes soporte: usa el botón SOS de tu grupo y llama al 911.
        </p>
      </div>
    </div>
  );
}
