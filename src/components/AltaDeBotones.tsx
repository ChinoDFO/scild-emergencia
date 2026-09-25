import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  crearBoton,
  listarInventarioBotones,
  type BotonEnInventario,
  type BotonRecienCreado,
} from "../services/api";

// "Fábrica" del panel de administración: dar de alta un botón antes de
// venderlo, y ver lo que hay armado y sin dueño.
//
// Esto se hacía solo por terminal (`npm run device:create`), o sea que lo
// podía hacer únicamente quien tuviera el proyecto y el acceso a la base en
// su computadora. Sirve para armar tres botones a mano, no para producir.
//
// El deviceSecret se enseña UNA sola vez, aquí, justo después de crearlo: en
// la base queda solo su hash, así que no hay pantalla que lo pueda volver a
// mostrar. Por eso la tarjeta del secreto es la que más espacio ocupa y no se
// cierra sola.

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

function Copiable({
  etiqueta,
  valor,
  destacado,
  nota,
}: {
  etiqueta: string;
  valor: string;
  destacado?: boolean;
  nota?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): el valor está a la vista y
      // se puede seleccionar a mano, así que no vale la pena un error.
      setCopiado(false);
    }
  };

  return (
    <div className={`rounded-lg p-3 ${destacado ? "bg-amber-50 ring-1 ring-amber-300" : "bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{etiqueta}</p>
        <button
          type="button"
          onClick={copiar}
          className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-600"
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-sm text-slate-900">{valor}</p>
      {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

export default function AltaDeBotones() {
  const [inventario, setInventario] = useState<BotonEnInventario[]>([]);
  const [siguienteCodigo, setSiguienteCodigo] = useState("");
  const [deviceCode, setDeviceCode] = useState("");
  const [nombre, setNombre] = useState("");
  const [creado, setCreado] = useState<BotonRecienCreado | null>(null);
  const [creando, setCreando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const datos = await listarInventarioBotones();
      setInventario(datos.dispositivos);
      setSiguienteCodigo(datos.siguienteCodigo);
      // El campo arranca con el siguiente de la serie, pero se puede cambiar:
      // la numeración es nuestra, no del sistema.
      setDeviceCode((actual) => actual || datos.siguienteCodigo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el inventario");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function darDeAlta(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreando(true);
    try {
      const boton = await crearBoton({
        deviceCode: deviceCode.trim().toUpperCase(),
        ...(nombre.trim() ? { nombre: nombre.trim() } : {}),
      });
      setCreado(boton);
      setNombre("");
      setDeviceCode("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dar de alta el botón");
    } finally {
      setCreando(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">Dar de alta un botón</h2>
      <p className="mt-1 text-sm text-slate-500">
        El paso de fábrica: registra el aparato y genera sus códigos. El secreto se muestra una
        sola vez.
      </p>

      <form onSubmit={darDeAlta} className="mt-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-3">
          <label className="min-w-40 flex-1 text-xs font-medium text-slate-600">
            Código del botón
            <input
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
              placeholder={siguienteCodigo || "BTN-001"}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-red-500 focus:outline-none"
            />
          </label>
          <label className="min-w-40 flex-1 text-xs font-medium text-slate-600">
            Nombre (opcional)
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Botón de mostrador"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={creando || deviceCode.trim().length === 0}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {creando ? "Dando de alta…" : "Dar de alta"}
        </button>

        {siguienteCodigo && (
          <p className="mt-2 text-xs text-slate-500">
            El siguiente libre de la serie es <span className="font-mono">{siguienteCodigo}</span>.
          </p>
        )}
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {creado && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-2 ring-amber-400">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">Botón {creado.deviceCode} dado de alta</p>
              <p className="mt-1 text-sm text-amber-700">
                Copia el secreto <b>ahora</b>. No se vuelve a mostrar: en la base solo queda una
                huella suya. Si se pierde, hay que dar de alta otro botón.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreado(null)}
              className="shrink-0 text-sm font-medium text-slate-400 hover:text-slate-700"
            >
              Ya lo copié
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Copiable
              etiqueta="Código del botón"
              valor={creado.deviceCode}
              nota="Va en el ESP32. Es público."
            />
            <Copiable
              etiqueta="Secreto"
              valor={creado.deviceSecret}
              destacado
              nota="Va en el ESP32. Una sola vez."
            />
            <Copiable
              etiqueta="Código de la caja"
              valor={creado.codigoDeLaCaja}
              nota="Se imprime en la etiqueta. Lo teclea el cliente."
            />
          </div>
        </div>
      )}

      <h3 className="mt-6 text-sm font-semibold text-slate-900">
        En inventario {inventario.length > 0 && `(${inventario.length})`}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Botones dados de alta que todavía no tiene nadie.
      </p>

      {cargando && <p className="mt-3 text-sm text-slate-500">Cargando…</p>}

      {!cargando && (
        <ul className="mt-3 space-y-2">
          {inventario.length === 0 && (
            <li className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">
              No hay botones sin dueño.
            </li>
          )}
          {inventario.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-slate-900">{b.deviceCode}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Caja: <span className="font-mono">{b.codigoDeLaCaja}</span>
                  {b.nombre && ` · ${b.nombre}`}
                  {b.grupo && ` · ${b.grupo}`}
                </p>
                <p className="text-xs text-slate-400">
                  Dado de alta el {fecha(b.creadoEl)}
                  {b.firmware && ` · firmware ${b.firmware}`}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  b.probado ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                }`}
              >
                {b.probado ? "Ya se conectó" : "Sin conectar"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
