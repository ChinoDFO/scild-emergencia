import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMensajes } from "../hooks/useMensajes";
import { usePerfil } from "../context/PerfilContext";
import { marcarChatLeido } from "../services/api";
import type { Alerta, Mensaje } from "../services/api";
import { ETIQUETA_ESTADO, origen } from "../services/formatoAlertas";
import MenuAlertas from "./MenuAlertas";
import ProtocoloAlerta from "./ProtocoloAlerta";

type Elemento =
  | { clase: "mensaje"; clave: string; m: Mensaje; conNombre: boolean }
  | { clase: "alerta"; clave: string; a: Alerta };

// Cada día es su propio bloque para que su etiqueta ("Hoy", "Ayer") se quede
// fija arriba solo mientras se ven mensajes de ese día, sin encimarse.
interface Dia {
  clave: string;
  texto: string;
  elementos: Elemento[];
}

// Color del nombre de cada persona en el chat, siempre el mismo para ella.
// Son variables del tema: los tonos oscuros no se leerían en modo oscuro.
const COLORES_NOMBRE = [
  "var(--nombre-1)",
  "var(--nombre-2)",
  "var(--nombre-3)",
  "var(--nombre-4)",
  "var(--nombre-5)",
  "var(--nombre-6)",
];
function colorDe(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COLORES_NOMBRE[Math.abs(h) % COLORES_NOMBRE.length];
}

function etiquetaDia(fecha: Date) {
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
  if (fecha.toDateString() === ayer.toDateString()) return "Ayer";
  return fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    ...(fecha.getFullYear() !== hoy.getFullYear() ? { year: "numeric" } : {}),
  });
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

// Mensajes y alertas en una sola línea de tiempo, agrupados por día.
function armarLineaDeTiempo(mensajes: Mensaje[], alertas: Alerta[], hayMas: boolean): Dia[] {
  // Si hay mensajes más viejos sin cargar, una alerta anterior al primer
  // mensaje cargado quedaría fuera de lugar: se muestra al cargar esa página.
  const desde = hayMas && mensajes.length ? mensajes[0].createdAt : "";
  const eventos = [
    ...mensajes.map((m) => ({ t: m.createdAt, m })),
    ...alertas.filter((a) => a.createdAt >= desde).map((a) => ({ t: a.createdAt, a })),
  ].sort((x, y) => x.t.localeCompare(y.t));

  const dias: Dia[] = [];
  let autorAnterior: string | null = null;

  for (const e of eventos) {
    const clave = new Date(e.t).toDateString();
    let dia = dias.at(-1);
    if (dia?.clave !== clave) {
      dia = { clave, texto: etiquetaDia(new Date(e.t)), elementos: [] };
      dias.push(dia);
      autorAnterior = null;
    }
    if ("m" in e && e.m) {
      dia.elementos.push({ clase: "mensaje", clave: e.m.id, m: e.m, conNombre: e.m.autor.id !== autorAnterior });
      autorAnterior = e.m.autor.id;
    } else if ("a" in e && e.a) {
      dia.elementos.push({ clase: "alerta", clave: `a-${e.a.id}`, a: e.a });
      autorAnterior = null;
    }
  }
  return dias;
}

interface Props {
  groupId: string;
  groupName: string;
  myUserId: string;
  // Sin esto no aparece el botón "!" de alertas: el chat funciona igual.
  puedoAlertar: boolean;
  // El ADMIN puede borrar el mensaje de cualquiera; sin esto, solo el suyo.
  esAdmin: boolean;
  alertas: Alerta[];
  alEnviarAlerta: () => void;
}

export default function Conversacion({
  groupId,
  groupName,
  myUserId,
  puedoAlertar,
  esAdmin,
  alertas,
  alEnviarAlerta,
}: Props) {
  const { mensajes, hayMas, cargandoAnteriores, cargarAnteriores, enviar, borrar, error } = useMensajes(groupId);
  const { marcarGrupoLeido } = usePerfil();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  // A qué mensaje se está respondiendo (como en WhatsApp): se dibuja arriba
  // de la caja y viaja con el siguiente mensaje que se mande.
  const [respondiendoA, setRespondiendoA] = useState<Mensaje | null>(null);
  const [errorBorrar, setErrorBorrar] = useState<string | null>(null);

  const lista = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLTextAreaElement>(null);
  // Solo se baja al final si ya estaba abajo: si está leyendo mensajes
  // viejos, uno nuevo no lo debe jalar.
  const pegadoAbajo = useRef(true);
  // Al cargar mensajes anteriores se conserva a la vista el mismo mensaje.
  const alturaAntesDeCargar = useRef<number | null>(null);

  // Ordenar y agrupar por día es trabajo real sobre TODO lo cargado del
  // chat; sin memo se repetía en cada letra que se escribe en la caja
  // (cualquier setState de este componente, no solo cuando llegan mensajes
  // o alertas de verdad nuevos).
  const dias = useMemo(
    () => (mensajes ? armarLineaDeTiempo(mensajes, alertas, hayMas) : []),
    [mensajes, alertas, hayMas]
  );
  const totalElementos = dias.reduce((n, d) => n + d.elementos.length, 0);

  useLayoutEffect(() => {
    const el = lista.current;
    if (!el) return;
    if (alturaAntesDeCargar.current !== null) {
      el.scrollTop = el.scrollHeight - alturaAntesDeCargar.current;
      alturaAntesDeCargar.current = null;
    } else if (pegadoAbajo.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [totalElementos]);

  // Si el área se encoge (se abre el teclado, el menú de alertas o aparece
  // una alerta fija arriba) y estaba abajo, se queda viendo lo más reciente.
  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const observador = new ResizeObserver(() => {
      if (pegadoAbajo.current) el.scrollTop = el.scrollHeight;
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Con el chat abierto, lo que llega ya se está leyendo: se pone el
  // contador en cero para que el globito de Grupos y el próximo aviso push
  // reflejen la realidad.
  useEffect(() => {
    if (!mensajes) return;
    const id = setTimeout(() => {
      marcarGrupoLeido(groupId);
      marcarChatLeido(groupId).catch(() => {
        // Si falla, el contador se corrige en la siguiente visita.
      });
    }, 800);
    return () => clearTimeout(id);
  }, [groupId, mensajes, marcarGrupoLeido]);

  const alDesplazar = () => {
    const el = lista.current;
    if (el) pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const verAnteriores = async () => {
    alturaAntesDeCargar.current = lista.current?.scrollHeight ?? null;
    await cargarAnteriores();
  };

  // La caja crece con el texto hasta ~5 renglones, como en las apps de chat.
  const ajustarAltura = () => {
    const el = caja.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const mandar = async (e?: FormEvent) => {
    e?.preventDefault();
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await enviar(contenido, respondiendoA?.id);
      pegadoAbajo.current = true;
      setTexto("");
      setRespondiendoA(null);
      requestAnimationFrame(ajustarAltura);
    } catch (err) {
      // El texto (y la respuesta elegida) se quedan para reintentar sin
      // volver a escribirlo.
      setErrorEnvio(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
      caja.current?.focus();
    }
  };

  const responder = (m: Mensaje) => {
    setRespondiendoA(m);
    caja.current?.focus();
  };

  const pedirBorrar = async (m: Mensaje) => {
    if (!confirm("¿Eliminar este mensaje? No se puede deshacer.")) return;
    setErrorBorrar(null);
    try {
      await borrar(m.id);
      if (respondiendoA?.id === m.id) setRespondiendoA(null);
    } catch (err) {
      setErrorBorrar(err instanceof Error ? err.message : "No se pudo eliminar el mensaje");
    }
  };

  // Enter envía; Shift+Enter hace salto de línea.
  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      mandar();
    }
  };

  const hayTexto = texto.trim().length > 0;

  // Pastilla flotante sobre la conversación (el día, "ver anteriores", los
  // avisos): el mismo gris-azul con trazo de las piezas del resto de la app.
  const pastilla = "rounded-full border-2 px-3 py-1 text-[11px] font-bold uppercase";
  const estiloPastilla = {
    background: "var(--superficie)",
    borderColor: "var(--borde)",
    color: "var(--texto)",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={lista} onScroll={alDesplazar} className="fondo-chat sin-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {mensajes === null && !error && (
          <p className="py-6 text-center text-sm" style={{ color: "var(--texto-tenue)" }}>
            Cargando…
          </p>
        )}

        {error && (
          <p className="my-3 flex justify-center">
            <span className={pastilla} style={{ ...estiloPastilla, color: "var(--peligro)" }}>
              {error}
            </span>
          </p>
        )}

        {hayMas && (
          <div className="py-2 text-center">
            <button
              onClick={verAnteriores}
              disabled={cargandoAnteriores}
              className={`${pastilla} disabled:opacity-60`}
              style={estiloPastilla}
            >
              {cargandoAnteriores ? "Cargando…" : "Ver mensajes anteriores"}
            </button>
          </div>
        )}

        {mensajes?.length === 0 && alertas.length === 0 && (
          <p
            className="tarjeta mx-auto mt-8 max-w-xs px-3 py-2 text-center text-xs"
            style={{ color: "var(--texto-tenue)" }}
          >
            Aquí van los mensajes y las alertas de {groupName}. Escribe el primero.
          </p>
        )}

        {dias.map((dia) => (
          <section key={dia.clave} aria-label={dia.texto}>
            <div className="pointer-events-none sticky top-1 z-10 flex justify-center py-2">
              <span className={pastilla} style={estiloPastilla}>
                {dia.texto}
              </span>
            </div>
            <ul className="space-y-1.5">
              {dia.elementos.map((el) => {
                if (el.clase === "alerta") {
                  const a = el.a;
                  const estado = ETIQUETA_ESTADO[a.status];
                  return (
                    <li key={el.clave} className="flex justify-center py-1.5">
                      <div
                        className="w-[88%] max-w-sm rounded-2xl px-3 py-2"
                        style={{
                          background: "var(--superficie)",
                          border: "2px solid var(--borde)",
                          borderLeft: "6px solid var(--peligro)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold uppercase" style={{ color: "var(--texto)" }}>
                            <span aria-hidden>{a.tipo.emoji}</span> {a.tipo.etiqueta}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {a.ubicacion && (
                              <a
                                href={a.ubicacion}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Ver ubicación en el mapa"
                                className="flex size-6 items-center justify-center rounded-full border-2"
                                style={{ borderColor: "var(--borde)", color: "var(--texto)" }}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  className="size-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden
                                >
                                  <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
                                  <circle cx="12" cy="10" r="2.5" />
                                </svg>
                              </a>
                            )}
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase"
                              style={{ background: estado.fondo, color: estado.color }}
                            >
                              {estado.texto}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-[11px]" style={{ color: "var(--texto-tenue)" }}>
                          {origen(a)} · {hora(a.createdAt)}
                        </p>
                        {a.status !== "RESOLVED" && (
                          <p className="mt-0.5 text-[11px] font-bold" style={{ color: "var(--peligro)" }}>
                            Marca al {a.tipo.telefono}
                          </p>
                        )}
                        <ProtocoloAlerta tipo={a.tipo} />
                      </div>
                    </li>
                  );
                }

                const { m, conNombre } = el;
                const mio = m.autor.id === myUserId;
                const puedoBorrar = !m.eliminado && (mio || esAdmin);
                return (
                  <li
                    key={el.clave}
                    className={`flex flex-col ${mio ? "items-end" : "items-start"} ${conNombre ? "pt-1.5" : ""}`}
                  >
                    <div
                      className={`relative max-w-[82%] rounded-2xl px-3 pb-1.5 pt-1.5 text-[15px] ${
                        mio ? "burbuja-mia" : "burbuja-otro"
                      } ${conNombre ? (mio ? "rounded-tr-md" : "rounded-tl-md") : ""}`}
                      style={{ color: "var(--texto)" }}
                    >
                      {!mio && conNombre && (
                        <p className="text-[13px] font-bold" style={{ color: colorDe(m.autor.id) }}>
                          {m.autor.nombre}
                        </p>
                      )}

                      {/* Cita del mensaje al que responde, como la barra de
                          WhatsApp: autor + su texto (o "Mensaje eliminado"
                          si ya no existe). */}
                      {m.respondeA && (
                        <div
                          className="mb-1 max-w-full rounded-lg border-l-4 px-2 py-1 text-[12px]"
                          style={{ background: "var(--superficie-suave)", borderColor: colorDe(m.respondeA.autor.id) }}
                        >
                          <p className="truncate font-bold" style={{ color: colorDe(m.respondeA.autor.id) }}>
                            {m.respondeA.autor.id === myUserId ? "Tú" : m.respondeA.autor.nombre}
                          </p>
                          <p className="truncate" style={{ color: "var(--texto-tenue)" }}>
                            {m.respondeA.eliminado ? "Mensaje eliminado" : m.respondeA.content}
                          </p>
                        </div>
                      )}

                      <p
                        className="whitespace-pre-wrap break-words"
                        style={m.eliminado ? { color: "var(--texto-tenue)", fontStyle: "italic" } : undefined}
                      >
                        {m.eliminado ? "Mensaje eliminado" : m.content}
                        {/* Reserva el espacio de la hora para que no se encime con el texto. */}
                        <span className="invisible ml-2 text-[11px]">{hora(m.createdAt)}</span>
                      </p>
                      <span
                        className="absolute bottom-1 right-2.5 text-[11px]"
                        style={{ color: "var(--texto-tenue)" }}
                      >
                        {hora(m.createdAt)}
                      </span>
                    </div>

                    {/* Responder/Eliminar: chicos y discretos a propósito,
                        no hace falta un gesto de deslizar para llegar a
                        ellos. Un mensaje ya eliminado no ofrece ninguno. */}
                    {!m.eliminado && (
                      <div className="flex gap-3 px-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => responder(m)}
                          aria-label="Responder este mensaje"
                          className="opacity-60 transition active:scale-90 active:opacity-100"
                          style={{ color: "var(--texto-tenue)" }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M9 17 4 12l5-5" />
                            <path d="M4 12h11a5 5 0 0 1 5 5v2" />
                          </svg>
                        </button>
                        {puedoBorrar && (
                          <button
                            type="button"
                            onClick={() => pedirBorrar(m)}
                            aria-label="Eliminar este mensaje"
                            className="opacity-60 transition active:scale-90 active:opacity-100"
                            style={{ color: "var(--texto-tenue)" }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="size-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M5 7h14" />
                              <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              <path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div style={{ background: "var(--fondo)", borderTop: "2px solid var(--borde)" }}>
        {menuAbierto && puedoAlertar && (
          <div className="pt-2">
            <MenuAlertas
              groupId={groupId}
              groupName={groupName}
              alCerrar={() => setMenuAbierto(false)}
              alEnviar={() => {
                setMenuAbierto(false);
                pegadoAbajo.current = true;
                alEnviarAlerta();
              }}
            />
          </div>
        )}

        {errorEnvio && (
          <p className="px-3 pt-2 text-sm font-bold" style={{ color: "var(--peligro)" }}>
            No se pudo enviar: {errorEnvio}
          </p>
        )}

        {errorBorrar && (
          <p className="px-3 pt-2 text-sm font-bold" style={{ color: "var(--peligro)" }}>
            {errorBorrar}
          </p>
        )}

        {/* Respondiendo a un mensaje: la cita viaja con lo que se escriba a
            continuación, y se puede cancelar sin perder el texto ya tecleado. */}
        {respondiendoA && (
          <div
            className="mx-2 mt-2 flex items-start justify-between gap-2 rounded-xl border-l-4 px-3 py-2 text-xs"
            style={{ background: "var(--superficie-suave)", borderColor: colorDe(respondiendoA.autor.id) }}
          >
            <div className="min-w-0">
              <p className="font-bold" style={{ color: colorDe(respondiendoA.autor.id) }}>
                Respondiendo a {respondiendoA.autor.id === myUserId ? "ti mismo" : respondiendoA.autor.nombre}
              </p>
              <p className="truncate" style={{ color: "var(--texto-tenue)" }}>
                {respondiendoA.eliminado ? "Mensaje eliminado" : respondiendoA.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRespondiendoA(null)}
              aria-label="Cancelar respuesta"
              className="shrink-0 text-base font-black leading-none"
              style={{ color: "var(--texto-tenue)" }}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={mandar} className="flex items-end gap-2 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <textarea
            ref={caja}
            rows={1}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              ajustarAltura();
            }}
            onKeyDown={alTeclear}
            onFocus={() => setMenuAbierto(false)}
            maxLength={1000}
            placeholder="Mensaje"
            aria-label="Mensaje"
            className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border-2 px-4 py-3 text-[15px] leading-6 outline-none"
            style={{ borderColor: "var(--borde)", background: "var(--fondo)", color: "var(--texto)" }}
          />

          {hayTexto || !puedoAlertar ? (
            <button
              type="submit"
              disabled={enviando || !hayTexto}
              aria-label="Enviar mensaje"
              className="flex size-12 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40"
              style={{ background: "var(--texto)", color: "var(--fondo)" }}
            >
              <svg viewBox="0 0 24 24" className="size-5 translate-x-px" fill="currentColor" aria-hidden>
                <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" />
              </svg>
            </button>
          ) : (
            // Alertas por tipo. Cuadrado y amarillo: el SOS de la barra de
            // abajo es un círculo oscuro, y son dos cosas distintas — aquí se
            // elige QUÉ pasa, allá se pide ayuda sin pensar.
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              aria-label={menuAbierto ? "Cerrar menú de alertas" : "Enviar una alerta de un tipo específico"}
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 text-2xl font-black leading-none transition active:scale-95"
              style={{
                background: menuAbierto ? "var(--superficie)" : "var(--alerta)",
                borderColor: "var(--borde)",
                color: menuAbierto ? "var(--texto)" : "var(--alerta-texto)",
              }}
            >
              {menuAbierto ? "×" : "!"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
