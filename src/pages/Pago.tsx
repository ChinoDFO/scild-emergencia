import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  abrirSolicitudPago,
  obtenerAcceso,
  obtenerPagos,
  responderEnPago,
  subirComprobante,
  type DatosDePago,
  type SolicitudPago,
} from "../services/api";

// 5 MB, igual que el tope del backend. Se revisa aquí también para no
// hacerle subir 12 MB a alguien con datos móviles y que falle al final.
const MAX_CAPTURA = 5 * 1024 * 1024;
const TIPOS = "image/jpeg,image/png,image/webp";

const ETIQUETA_ESTADO: Record<SolicitudPago["status"], { texto: string; clase: string }> = {
  ABIERTA: { texto: "Esperando tu pago", clase: "bg-amber-100 text-amber-900" },
  EN_REVISION: { texto: "Revisando tu comprobante", clase: "bg-sky-100 text-sky-900" },
  APROBADA: { texto: "Aprobada", clase: "bg-emerald-100 text-emerald-900" },
  RECHAZADA: { texto: "Rechazada", clase: "bg-red-100 text-red-900" },
  CANCELADA: { texto: "Cancelada", clase: "bg-slate-200 text-slate-700" },
};

const hora = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

// Chat con los administradores para ampliar el límite de accesos.
//
// El cliente NO escribe texto libre: elige entre respuestas predeterminadas.
// Así el hilo es predecible, no hay nada que moderar y nadie acaba
// escribiendo el número de su tarjeta en un chat que no es para eso.
export default function Pago() {
  const [parametros] = useSearchParams();
  const botonPedido = parametros.get("boton");

  const [datos, setDatos] = useState<DatosDePago | null>(null);
  const [respuestas, setRespuestas] = useState<{ id: string; texto: string }[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudPago[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(botonPedido);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const finDelHilo = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const pantalla = await obtenerPagos();
      setDatos(pantalla.datos);
      setRespuestas(pantalla.respuestas);
      setSolicitudes(pantalla.solicitudes);

      // Sin botón en la dirección, se usa el primero del que sea titular.
      if (!botonPedido) {
        const acceso = await obtenerAcceso();
        setDeviceId(acceso.botones[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    }
  }, [botonPedido]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abierta = solicitudes.find((s) => s.status === "ABIERTA" || s.status === "EN_REVISION");
  const cerradas = solicitudes.filter((s) => s !== abierta);

  useEffect(() => {
    finDelHilo.current?.scrollIntoView({ block: "nearest" });
  }, [abierta?.messages.length]);

  const conError = async (accion: () => Promise<void>) => {
    setOcupado(true);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar");
    } finally {
      setOcupado(false);
    }
  };

  const abrir = () =>
    conError(async () => {
      if (!deviceId) throw new Error("No tienes ningún botón registrado a tu cuenta");
      const nueva = await abrirSolicitudPago(deviceId);
      setSolicitudes((previas) => [nueva, ...previas.filter((s) => s.id !== nueva.id)]);
    });

  const responder = (kind: string) =>
    conError(async () => {
      if (!abierta) return;
      const actualizada = await responderEnPago(abierta.id, kind);
      setSolicitudes((previas) => previas.map((s) => (s.id === actualizada.id ? actualizada : s)));
    });

  const mandarCaptura = (archivoElegido: File) =>
    conError(async () => {
      if (!abierta) return;
      if (archivoElegido.size > MAX_CAPTURA) {
        throw new Error("La captura pesa más de 5 MB. Manda una más chica.");
      }
      const actualizada = await subirComprobante(abierta.id, archivoElegido);
      setSolicitudes((previas) => previas.map((s) => (s.id === actualizada.id ? actualizada : s)));
    });

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Ampliar límite</h1>
          <Link to="/codigos" className="text-sm font-medium text-slate-500 hover:text-red-600">
            Volver
          </Link>
        </div>

        {datos && (
          <p className="mt-2 text-sm text-slate-500">
            Con una ampliación, otras {datos.accesos} personas de tu grupo pueden enviar alertas.
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {/* --- Sin solicitud abierta --- */}
        {!abierta && (
          <button
            onClick={abrir}
            disabled={ocupado || !deviceId}
            className="mt-5 w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {ocupado ? "Abriendo…" : "Quiero ampliar mi límite"}
          </button>
        )}

        {/* --- El hilo --- */}
        {abierta && (
          <section className="mt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">{abierta.boton}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ETIQUETA_ESTADO[abierta.status].clase}`}
              >
                {ETIQUETA_ESTADO[abierta.status].texto}
              </span>
            </div>

            <div className="fondo-chat mt-2 max-h-96 space-y-2 overflow-y-auto rounded-xl p-3">
              {abierta.messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === "CLIENTE" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                      m.from === "CLIENTE" ? "bg-rose-100 text-slate-900" : "bg-white text-slate-900"
                    }`}
                  >
                    {/* Los datos bancarios vienen con saltos de línea. */}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{hora(m.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={finDelHilo} />
            </div>

            {/* La captura: una por solicitud. */}
            {abierta.esperaComprobante && (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
                <p className="text-sm text-amber-900">
                  Manda la captura de tu comprobante. <strong>Solo se puede enviar una</strong>, así
                  que revisa antes que se vean el monto y la fecha.
                </p>
                <input
                  ref={archivo}
                  type="file"
                  accept={TIPOS}
                  className="hidden"
                  onChange={(e) => {
                    const elegido = e.target.files?.[0];
                    e.target.value = "";
                    if (elegido) mandarCaptura(elegido);
                  }}
                />
                <button
                  onClick={() => archivo.current?.click()}
                  disabled={ocupado}
                  className="mt-2 w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {ocupado ? "Enviando…" : "Elegir captura"}
                </button>
              </div>
            )}

            {/* Respuestas predeterminadas. */}
            {(abierta.status === "ABIERTA" || abierta.status === "EN_REVISION") && (
              <div className="mt-3 flex flex-wrap gap-2">
                {respuestas.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => responder(r.id)}
                    disabled={ocupado}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {r.texto}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- Historial --- */}
        {cerradas.length > 0 && (
          <section className="mt-6 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-medium text-slate-700">Solicitudes anteriores</h2>
            <ul className="mt-2 space-y-1">
              {cerradas.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">{hora(s.createdAt)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ETIQUETA_ESTADO[s.status].clase}`}
                    >
                      {ETIQUETA_ESTADO[s.status].texto}
                    </span>
                  </div>
                  {s.note && <p className="mt-1 text-xs text-slate-500">{s.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
