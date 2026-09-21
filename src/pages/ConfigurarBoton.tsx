import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import { actualizarGrupo, obtenerAcceso, type BotonDeAcceso } from "../services/api";

// "CONFIGURA TU BOTÓN" del diseño: dos bloques punteados —el establecimiento
// y la red WiFi— y un GUARDAR.
//
// El establecimiento sí se guarda: son el nombre y la dirección del grupo al
// que está vinculado el botón, y eso ya existe.
//
// La red WiFi NO se puede guardar todavía, y es importante entender por qué:
// las credenciales tienen que llegar al ESP32, y no hay por dónde. El aparato
// habla con el backend solo cuando YA tiene internet, así que mandárselas por
// ahí no sirve para conectarlo la primera vez; eso se resuelve con
// aprovisionamiento por Bluetooth o con el botón levantando su propio WiFi.
// Se deja el formulario dibujado y desactivado en lugar de guardar una
// contraseña que nadie va a leer.

export default function ConfigurarBoton() {
  const { id } = useParams();
  const [boton, setBoton] = useState<BotonDeAcceso | null>(null);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAcceso()
      .then((a) => {
        const b = a.botones.find((x) => x.id === id) ?? null;
        setBoton(b);
        setNombre(b?.grupo?.name ?? "");
        setDireccion(b?.direccion ?? "");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!boton?.grupo) return;
    setError(null);
    setAviso(null);
    setGuardando(true);
    try {
      await actualizarGrupo(boton.grupo.id, { name: nombre.trim(), address: direccion.trim() });
      setAviso("Guardado.");
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
        <div className="punteado rounded-2xl p-4" style={{ background: "var(--fondo)" }}>
          <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
            Dirección del establecimiento
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              disabled={!boton?.grupo}
              className="mt-1 w-full border-b-2 bg-transparent pb-1 text-sm font-normal normal-case outline-none disabled:opacity-50"
              style={{ borderColor: "var(--borde-tenue)", color: "var(--texto)" }}
            />
          </label>
          <label className="mt-4 block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
            Nombre del establecimiento
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={!boton?.grupo}
              className="mt-1 w-full border-b-2 bg-transparent pb-1 text-sm font-normal normal-case outline-none disabled:opacity-50"
              style={{ borderColor: "var(--borde-tenue)", color: "var(--texto)" }}
            />
          </label>
        </div>

        <div className="punteado rounded-2xl p-4 opacity-60" style={{ background: "var(--fondo)" }}>
          <label className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
            Red Wi-Fi
            <input
              disabled
              placeholder="Pendiente"
              className="mt-1 w-full border-b-2 bg-transparent pb-1 text-sm font-normal normal-case outline-none"
              style={{ borderColor: "var(--borde-tenue)", color: "var(--texto)" }}
            />
          </label>
          <label className="mt-4 block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
            Contraseña Wi-Fi
            <input
              disabled
              type="password"
              placeholder="Pendiente"
              className="mt-1 w-full border-b-2 bg-transparent pb-1 text-sm font-normal normal-case outline-none"
              style={{ borderColor: "var(--borde-tenue)", color: "var(--texto)" }}
            />
          </label>
          <p className="mt-3 text-[11px] normal-case" style={{ color: "var(--texto-tenue)" }}>
            La red se le pasa al botón desde el propio aparato, no desde aquí: cuando todavía no
            tiene internet no hay forma de que reciba nada del servidor.
          </p>
        </div>

        {sinGrupo && (
          <p className="text-xs" style={{ color: "var(--texto-tenue)" }}>
            Este botón no está vinculado a ningún grupo, así que no tiene establecimiento que
            configurar todavía.
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
          disabled={guardando || !boton?.grupo}
          className="w-full rounded-2xl py-3 text-sm font-bold uppercase disabled:opacity-50"
          style={{ background: "var(--fondo)", color: "var(--texto)" }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Pantalla>
  );
}
