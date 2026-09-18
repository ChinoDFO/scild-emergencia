import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { enviarMensaje, listarMensajes, type Mensaje } from "../services/api";
import { useAlReconectar, useEventoTiempoReal } from "../services/tiempoReal";

interface Props {
  groupId: string;
  myUserId: string;
}

// Junta mensajes sin duplicar (el que yo mando llega dos veces: en la
// respuesta del POST y por el socket) y los deja en orden cronológico.
function combinar(actuales: Mensaje[], nuevos: Mensaje[]) {
  const porId = new Map(actuales.map((m) => [m.id, m]));
  for (const m of nuevos) porId.set(m.id, m);
  return [...porId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function horaCorta(fecha: string) {
  const d = new Date(fecha);
  const hoy = new Date().toDateString() === d.toDateString();
  return hoy
    ? d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function Chat({ groupId, myUserId }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lista = useRef<HTMLDivElement>(null);
  // Solo se baja al final si el usuario ya estaba abajo: si está leyendo
  // mensajes viejos, uno nuevo no lo debe jalar.
  const pegadoAbajo = useRef(true);

  // "inicial": solo la primera carga decide si hay mensajes más viejos; al
  // recargar tras una reconexión no se toca (ya pudo haber paginado).
  const cargarRecientes = useCallback(async (inicial = false) => {
    try {
      const pagina = await listarMensajes(groupId);
      setMensajes((actuales) => combinar(actuales ?? [], pagina.mensajes));
      if (inicial) setHayMas(pagina.hayMas);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el chat");
    }
  }, [groupId]);

  useEffect(() => {
    setMensajes(null);
    pegadoAbajo.current = true;
    cargarRecientes(true);
  }, [cargarRecientes]);

  useEventoTiempoReal("mensaje:nuevo", (m) => {
    if (m.groupId === groupId) setMensajes((actuales) => combinar(actuales ?? [], [m]));
  });

  // Lo que llegó mientras no había conexión no pasó por el socket.
  useAlReconectar(() => cargarRecientes());

  useLayoutEffect(() => {
    if (pegadoAbajo.current && lista.current) {
      lista.current.scrollTop = lista.current.scrollHeight;
    }
  }, [mensajes]);

  const alDesplazar = () => {
    const el = lista.current;
    if (el) pegadoAbajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const cargarAnteriores = async () => {
    if (!mensajes?.length) return;
    setCargandoAnteriores(true);
    const el = lista.current;
    const alturaAntes = el?.scrollHeight ?? 0;
    try {
      const pagina = await listarMensajes(groupId, mensajes[0].createdAt);
      pegadoAbajo.current = false;
      setMensajes((actuales) => combinar(actuales ?? [], pagina.mensajes));
      setHayMas(pagina.hayMas);
      // Mantener a la vista el mismo mensaje en vez de saltar hasta arriba.
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - alturaAntes;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los anteriores");
    } finally {
      setCargandoAnteriores(false);
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;

    setEnviando(true);
    setError(null);
    try {
      const mensaje = await enviarMensaje(groupId, contenido);
      pegadoAbajo.current = true;
      setMensajes((actuales) => combinar(actuales ?? [], [mensaje]));
      setTexto("");
    } catch (err) {
      // El texto se queda en la caja para reintentar sin volver a escribirlo.
      setError(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div
        ref={lista}
        onScroll={alDesplazar}
        className="h-[55svh] min-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200"
      >
        {mensajes === null && !error && <p className="text-center text-sm text-slate-400">Cargando…</p>}

        {hayMas && (
          <div className="text-center">
            <button
              onClick={cargarAnteriores}
              disabled={cargandoAnteriores}
              className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-60"
            >
              {cargandoAnteriores ? "Cargando…" : "Ver mensajes anteriores"}
            </button>
          </div>
        )}

        {mensajes?.length === 0 && (
          <p className="pt-8 text-center text-sm text-slate-400">
            Aún no hay mensajes. Escribe el primero.
          </p>
        )}

        {mensajes?.map((m, i) => {
          const mio = m.autor.id === myUserId;
          // El nombre solo en el primero de una racha del mismo autor.
          const mismoQueAnterior = i > 0 && mensajes[i - 1].autor.id === m.autor.id;
          return (
            <div key={m.id} className={`flex flex-col ${mio ? "items-end" : "items-start"}`}>
              {!mio && !mismoQueAnterior && (
                <span className="mb-0.5 px-1 text-xs font-medium text-slate-500">{m.autor.nombre}</span>
              )}
              <div
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${
                  mio ? "rounded-br-sm bg-red-600 text-white" : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-200"
                }`}
              >
                {m.content}
                <span className={`ml-2 align-bottom text-[10px] ${mio ? "text-red-100" : "text-slate-400"}`}>
                  {horaCorta(m.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={enviar} className="mt-2 flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={1000}
          placeholder="Escribe un mensaje…"
          aria-label="Mensaje"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {enviando ? "…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
