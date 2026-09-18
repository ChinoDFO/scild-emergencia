import { useEffect, useState } from "react";
import { generarAlerta, listarTiposAlerta, type TipoAlerta } from "../services/api";

// Si el catálogo no carga (sin red, backend dormido) igual se debe poder
// pedir ayuda: queda al menos la alerta general.
const RESPALDO: TipoAlerta[] = [{ id: "GENERAL", etiqueta: "Emergencia", emoji: "🚨" }];

interface Props {
  groupId: string;
  groupName: string;
  alEnviar?: () => void;
}

// El botón grande abre un menú de "¿Qué está pasando?" y al tocar una opción
// la alerta sale de inmediato. Son dos toques deliberados (abrir + elegir):
// suficiente para que no se dispare con el celular en la bolsa, sin meter un
// tercer "¿confirmas?" cuando cada segundo cuenta.
export default function BotonAlerta({ groupId, groupName, alEnviar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tipos, setTipos] = useState<TipoAlerta[]>(RESPALDO);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    listarTiposAlerta()
      .then(setTipos)
      .catch(() => setTipos(RESPALDO));
  }, []);

  const enviar = async (tipo: TipoAlerta) => {
    setEnviando(tipo.id);
    setAviso(null);
    try {
      await generarAlerta(groupId, tipo.id);
      setAviso({ ok: true, texto: `Enviada: ${tipo.emoji} ${tipo.etiqueta}. Se avisó a ${groupName}.` });
      setAbierto(false);
      alEnviar?.();
    } catch (e) {
      setAviso({
        ok: false,
        texto: e instanceof Error ? `No se pudo enviar: ${e.message}` : "No se pudo enviar",
      });
    } finally {
      setEnviando(null);
    }
  };

  return (
    <div>
      {!abierto ? (
        <button
          onClick={() => {
            setAbierto(true);
            setAviso(null);
          }}
          aria-expanded={false}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-lg font-bold text-white shadow-md shadow-red-200 transition active:scale-[0.98] hover:bg-red-700"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white text-2xl font-black text-red-600">
            !
          </span>
          Enviar alerta
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl ring-2 ring-red-600">
          <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white">
            <span className="font-semibold">¿Qué está pasando?</span>
            <button
              onClick={() => setAbierto(false)}
              disabled={enviando !== null}
              className="rounded-lg px-2 py-1 text-sm font-medium text-red-100 hover:bg-red-700 hover:text-white"
            >
              Cancelar
            </button>
          </div>
          <ul className="divide-y divide-red-100 bg-white">
            {tipos.map((tipo) => (
              <li key={tipo.id}>
                <button
                  onClick={() => enviar(tipo)}
                  disabled={enviando !== null}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-base font-medium text-slate-800 hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
                >
                  <span className="text-2xl" aria-hidden>
                    {tipo.emoji}
                  </span>
                  <span className="flex-1">{tipo.etiqueta}</span>
                  {enviando === tipo.id && <span className="text-sm text-red-600">Enviando…</span>}
                </button>
              </li>
            ))}
          </ul>
          <p className="bg-red-50 px-4 py-2 text-xs text-red-700">
            Al tocar una opción se avisa de inmediato a todos los de {groupName}.
          </p>
        </div>
      )}

      {aviso && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-sm ${
            aviso.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
