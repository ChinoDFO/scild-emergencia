import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import {
  actualizarGrupo,
  guardarConfigBoton,
  obtenerAcceso,
  obtenerConfigBoton,
  type BotonDeAcceso,
  type CambiosConfigBoton,
  type ConfigBoton,
} from "../services/api";

// "CONFIGURA TU BOTÓN" del diseño.
//
// Esto antes se hacía yendo hasta donde está el aparato, conectándose a la
// red que él levanta (ALARMA-CONFIG, 192.168.4.1) y llenando un formulario en
// el navegador. Ahora se manda desde aquí: los ajustes se guardan en el
// servidor y el botón los baja en su siguiente aviso de vida, que es el único
// momento en que se le puede hablar —está detrás del router del cliente y no
// recibe conexiones de fuera—. Por eso los cambios no son instantáneos y la
// pantalla lo dice en vez de fingir que sí.
//
// Lo único que NO se puede mandar por aquí es la red WiFi PRINCIPAL: para
// recibirla el botón ya tendría que estar conectado. Esa sigue capturándose
// una vez en su portal. La de RESPALDO sí, porque se aplica cuando la
// principal se cae.

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="punteado rounded-2xl p-4" style={{ background: "var(--fondo)" }}>
      <p className="text-[11px] font-bold uppercase" style={{ color: "var(--texto-tenue)" }}>
        {titulo}
      </p>
      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  alCambiar,
  desactivado,
  tipo = "text",
  placeholder,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  alCambiar: (v: string) => void;
  desactivado?: boolean;
  tipo?: "text" | "password" | "number";
  placeholder?: string;
  ayuda?: string;
}) {
  return (
    <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
      {etiqueta}
      <input
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        disabled={desactivado}
        type={tipo}
        placeholder={placeholder}
        className="mt-1 w-full border-b-2 bg-transparent pb-1 text-sm font-normal normal-case outline-none disabled:opacity-50"
        style={{ borderColor: "var(--borde-tenue)", color: "var(--texto)" }}
      />
      {ayuda && (
        <span className="mt-1 block text-[10px] font-normal normal-case" style={{ color: "var(--texto-tenue)" }}>
          {ayuda}
        </span>
      )}
    </label>
  );
}

export default function ConfigurarBoton() {
  const { id } = useParams();
  const [boton, setBoton] = useState<BotonDeAcceso | null>(null);
  const [config, setConfig] = useState<ConfigBoton | null>(null);

  // Establecimiento: es el grupo al que el botón está vinculado.
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [direccion, setDireccion] = useState("");
  // Aparato.
  const [nombreBoton, setNombreBoton] = useState("");
  const [minutosSenal, setMinutosSenal] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [ssidRespaldo, setSsidRespaldo] = useState("");
  const [passRespaldo, setPassRespaldo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([obtenerAcceso(), obtenerConfigBoton(id)])
      .then(([acceso, cfg]) => {
        const b = acceso.botones.find((x) => x.id === id) ?? null;
        setBoton(b);
        setNombreGrupo(b?.grupo?.name ?? "");
        setDireccion(b?.direccion ?? "");
        setConfig(cfg);
        setNombreBoton(cfg.nombre ?? "");
        setMinutosSenal(String(Math.round(cfg.heartbeatSegundos / 60) || 1));
        setCooldown(String(cfg.cooldownSegundos ?? 10));
        setSsidRespaldo(cfg.ssidRespaldo ?? "");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!boton || !id) return;
    setError(null);
    setAviso(null);
    setGuardando(true);

    try {
      // El establecimiento vive en el grupo y ya tenía su propio endpoint:
      // se sigue guardando por ahí, sin tocar esa lógica.
      if (boton.grupo) {
        await actualizarGrupo(boton.grupo.id, {
          name: nombreGrupo.trim(),
          address: direccion.trim(),
        });
      }

      // Solo se manda lo que tiene valor. Un campo vacío no es "ponlo en
      // cero": es "no lo toques", y mandarlo haría que el servidor lo
      // rechazara por fuera de rango. La excepción es la red de respaldo,
      // donde vaciar el campo SÍ significa quitarla.
      const cambios: CambiosConfigBoton = { ssidRespaldo: ssidRespaldo.trim() };

      if (nombreBoton.trim().length > 0) cambios.nombre = nombreBoton.trim();
      if (minutosSenal.trim().length > 0) {
        cambios.heartbeatSegundos = Math.round(Number(minutosSenal) * 60);
      }
      if (cooldown.trim().length > 0) cambios.cooldownSegundos = Number(cooldown);
      // La contraseña, únicamente si se escribió algo: el campo llega vacío
      // aunque ya haya una guardada, porque el servidor nunca la devuelve.
      if (passRespaldo.length > 0) cambios.passRespaldo = passRespaldo;

      const nueva = await guardarConfigBoton(id, cambios);
      setConfig(nueva);
      setPassRespaldo("");

      const minutos = Math.max(Math.round(nueva.seAplicaEnSegundos / 60), 1);
      setAviso(
        `Guardado. El botón lo aplica en su próximo aviso de vida (máximo ${minutos} min). ` +
          "Si está apagado, en cuanto vuelva a encender."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  const sinGrupo = boton && !boton.grupo;

  return (
    <Pantalla titulo="Configura tu botón">
      <form onSubmit={guardar} className="tarjeta space-y-4 p-4">
        <Bloque titulo="Establecimiento">
          <Campo
            etiqueta="Dirección del establecimiento"
            valor={direccion}
            alCambiar={setDireccion}
            desactivado={!boton?.grupo}
            ayuda="Es a donde llega quien atiende la emergencia."
          />
          <Campo
            etiqueta="Nombre del establecimiento"
            valor={nombreGrupo}
            alCambiar={setNombreGrupo}
            desactivado={!boton?.grupo}
            ayuda="El del grupo al que este botón le avisa."
          />
        </Bloque>

        <Bloque titulo="El aparato">
          <Campo
            etiqueta="Nombre del botón"
            valor={nombreBoton}
            alCambiar={setNombreBoton}
            placeholder={boton?.deviceCode ?? ""}
            ayuda="Para distinguirlo en la lista: “Entrada”, “Caja”, “Casa 4”."
          />
          <Campo
            etiqueta="Aviso de vida (minutos)"
            valor={minutosSenal}
            alCambiar={setMinutosSenal}
            tipo="number"
            ayuda="Cada cuánto reporta que sigue conectado. Más seguido gasta más datos; más espaciado tarda en notarse que se cayó."
          />
          <Campo
            etiqueta="Espera entre alertas (segundos)"
            valor={cooldown}
            alCambiar={setCooldown}
            tipo="number"
            ayuda="Después de una alerta, cuánto ignora el botón si lo vuelven a presionar. De 5 a 300."
          />
        </Bloque>

        <Bloque titulo="Red de respaldo">
          <Campo
            etiqueta="Red Wi-Fi de respaldo"
            valor={ssidRespaldo}
            alCambiar={setSsidRespaldo}
            ayuda="La que usa si la principal se cae (el celular de alguien en modo compartir, por ejemplo)."
          />
          <Campo
            etiqueta="Contraseña de la red de respaldo"
            valor={passRespaldo}
            alCambiar={setPassRespaldo}
            tipo="password"
            placeholder={config?.passRespaldoPuesta ? "Ya hay una guardada" : ""}
            ayuda={
              config?.passRespaldoPuesta
                ? "Déjalo vacío para conservar la que ya está guardada."
                : undefined
            }
          />
          <p className="text-[11px] normal-case" style={{ color: "var(--texto-tenue)" }}>
            La red <b>principal</b> no se puede cambiar desde aquí: para recibirla, el botón ya
            tendría que estar conectado. Esa se captura una sola vez en el propio aparato, con el
            botón presionado al encenderlo.
          </p>
        </Bloque>

        {sinGrupo && (
          <p className="text-xs" style={{ color: "var(--texto-tenue)" }}>
            Este botón no está vinculado a ningún grupo, así que no tiene establecimiento que
            configurar todavía. Lo demás sí se puede ajustar.
          </p>
        )}
        {error && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--fondo)", color: "var(--peligro)" }}>
            {error}
          </p>
        )}
        {aviso && (
          <p className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--fondo)", color: "var(--texto)" }}>
            {aviso}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando || !boton}
          className="w-full rounded-2xl py-3 text-sm font-bold uppercase disabled:opacity-50"
          style={{ background: "var(--fondo)", color: "var(--texto)" }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Pantalla>
  );
}
