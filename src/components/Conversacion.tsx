import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMensajes } from "../hooks/useMensajes";
import { marcarChatLeido } from "../services/api";
import type { Alerta, Mensaje } from "../services/api";
import { ETIQUETA_ESTADO, origen } from "../services/formatoAlertas";
import MenuAlertas from "./MenuAlertas";

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
const COLORES_NOMBRE = [
  "text-rose-700",
  "text-sky-700",
  "text-violet-700",
  "text-amber-700",
  "text-emerald-700",
  "text-fuchsia-700",
  "text-indigo-700",
  "text-orange-700",
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
  alertas: Alerta[];
  alEnviarAlerta: () => void;
}

export default function Conversacion({ groupId, groupName, myUserId, alertas, alEnviarAlerta }: Props) {
  const { mensajes, hayMas, cargandoAnteriores, cargarAnteriores, enviar, error } = useMensajes(groupId);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const lista = useRef<HTMLDivElement>(null);
  const caja = useRef<HTMLTextAreaElement>(null);
  // Solo se baja al final si ya estaba abajo: si está leyendo mensajes
  // viejos, uno nuevo no lo debe jalar.
  const pegadoAbajo = useRef(true);
  // Al cargar mensajes anteriores se conserva a la vista el mismo mensaje.
  const alturaAntesDeCargar = useRef<number | null>(null);

  const dias = mensajes ? armarLineaDeTiempo(mensajes, alertas, hayMas) : [];
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
  // contador en cero para que el globito de Inicio y el próximo aviso push
  // reflejen la realidad.
  useEffect(() => {
    if (!mensajes) return;
    const id = setTimeout(() => {
      marcarChatLeido(groupId).catch(() => {
        // Si falla, el contador se corrige en la siguiente visita.
      });
    }, 800);
    return () => clearTimeout(id);
  }, [groupId, mensajes]);

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
      await enviar(contenido);
      pegadoAbajo.current = true;
      setTexto("");
      requestAnimationFrame(ajustarAltura);
    } catch (err) {
      // El texto se queda en la caja para reintentar sin volver a escribirlo.
      setErrorEnvio(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
      caja.current?.focus();
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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={lista} onScroll={alDesplazar} className="fondo-chat min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {mensajes === null && !error && <p className="py-6 text-center text-sm text-slate-500">Cargando…</p>}

        {error && (
          <p className="mx-auto my-3 max-w-xs rounded-lg bg-white/90 px-3 py-2 text-center text-sm text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {hayMas && (
          <div className="py-2 text-center">
            <button
              onClick={verAnteriores}
              disabled={cargandoAnteriores}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm disabled:opacity-60"
            >
              {cargandoAnteriores ? "Cargando…" : "Ver mensajes anteriores"}
            </button>
          </div>
        )}

        {mensajes?.length === 0 && alertas.length === 0 && (
          <p className="mx-auto mt-8 max-w-xs rounded-lg bg-amber-50/95 px-3 py-2 text-center text-xs text-amber-900 shadow-sm">
            Aquí van los mensajes y las alertas de {groupName}. Escribe el primero.
          </p>
        )}

        {dias.map((dia) => (
          <section key={dia.clave} aria-label={dia.texto}>
            <div className="pointer-events-none sticky top-1 z-10 flex justify-center py-2">
              <span className="rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">
                {dia.texto}
              </span>
            </div>
            <ul className="space-y-1">
              {dia.elementos.map((el) => {
                if (el.clase === "alerta") {
                  const a = el.a;
                  const estado = ETIQUETA_ESTADO[a.status];
                  return (
                    <li key={el.clave} className="flex justify-center py-1.5">
                      <div className="w-[85%] max-w-sm rounded-xl border-l-4 border-red-600 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            <span aria-hidden>{a.tipo.emoji}</span> {a.tipo.etiqueta}
                          </span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${estado.clase}`}>
                            {estado.texto}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {origen(a)} · {hora(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                }

                const { m, conNombre } = el;
                const mio = m.autor.id === myUserId;
                return (
                  <li
                    key={el.clave}
                    className={`flex ${mio ? "justify-end" : "justify-start"} ${conNombre ? "pt-1.5" : ""}`}
                  >
                    <div
                      className={`relative max-w-[82%] rounded-xl px-2.5 pb-1.5 pt-1 text-[15px] shadow-sm ${
                        mio ? "bg-rose-100 text-slate-900" : "bg-white text-slate-900"
                      } ${conNombre ? (mio ? "rounded-tr-none" : "rounded-tl-none") : ""}`}
                    >
                      {!mio && conNombre && (
                        <p className={`text-[13px] font-semibold ${colorDe(m.autor.id)}`}>{m.autor.nombre}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {m.content}
                        {/* Reserva el espacio de la hora para que no se encime con el texto. */}
                        <span className="invisible ml-2 text-[11px]">{hora(m.createdAt)}</span>
                      </p>
                      <span className="absolute bottom-1 right-2 text-[11px] text-slate-500">{hora(m.createdAt)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-slate-100">
        {menuAbierto && (
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

        {errorEnvio && <p className="px-3 pt-2 text-sm text-red-700">No se pudo enviar: {errorEnvio}</p>}

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
            className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-3 text-[15px] leading-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />

          {hayTexto ? (
            <button
              type="submit"
              disabled={enviando}
              aria-label="Enviar mensaje"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white shadow-md hover:bg-slate-900 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="size-5 translate-x-px" fill="currentColor" aria-hidden>
                <path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-expanded={menuAbierto}
              aria-label={menuAbierto ? "Cerrar menú de alertas" : "Enviar una alerta de un tipo específico"}
              className={`flex size-12 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-md ${
                menuAbierto ? "bg-slate-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {menuAbierto ? "×" : "!"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
