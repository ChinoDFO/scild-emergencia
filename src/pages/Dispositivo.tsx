import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import { obtenerAcceso, type BotonDeAcceso } from "../services/api";

// La pantalla de un botón: dirección con su estado arriba, y debajo la
// cuadrícula de seis datos del diseño.
//
// Todo eso lo reporta el ESP32 en su aviso de vida (POST /api/devices/heartbeat,
// firmware v8): red a la que está conectado, IP, señal, fallos de internet.
// Un botón que nunca ha reportado enseña "Sin datos" en gris: la casilla
// vacía dice la verdad —que no ha llegado esa información— mientras que
// esconderla haría pensar que no está planeada.

const ETIQUETA_ESTADO: Record<string, string> = {
  ONLINE: "En línea",
  IRREGULAR: "Señal irregular",
  OFFLINE: "Sin conexión",
  EMERGENCY: "Emergencia",
  MAINTENANCE: "Mantenimiento",
};

// Los dBm no le dicen nada a nadie; el adjetivo sí. Los cortes son los de
// siempre en WiFi: -55 o mejor es excelente, hasta -70 se aguanta, por
// debajo la conexión se cae sola.
function etiquetaSenal(rssi: number) {
  if (rssi >= -55) return "Excelente";
  if (rssi >= -70) return "Buena";
  return "Débil";
}

// "hace 2m" se lee de un vistazo; una fecha completa hay que interpretarla.
function tiempoRelativo(iso: string | null | undefined) {
  if (!iso) return null;
  const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (segundos < 60) return `hace ${Math.max(segundos, 0)}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas}h`;
  return `hace ${Math.floor(horas / 24)}d`;
}

function Dato({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor?: string | null;
  nota?: string;
}) {
  const sinDatos = !valor;
  return (
    <div
      className="trazo flex min-h-24 flex-col items-center justify-center rounded-2xl px-2 py-3 text-center"
      style={{ background: "var(--fondo)" }}
    >
      <p className="text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
        {titulo}
      </p>
      <p
        className="mt-1 text-sm"
        style={{ color: sinDatos ? "var(--texto-tenue)" : "var(--texto)" }}
      >
        {valor ?? "Sin datos"}
      </p>
      {nota && (
        <p className="mt-0.5 text-[10px]" style={{ color: "var(--texto-tenue)" }}>
          {nota}
        </p>
      )}
    </div>
  );
}

export default function Dispositivo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [boton, setBoton] = useState<BotonDeAcceso | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAcceso()
      .then((a) => {
        const encontrado = a.botones.find((b) => b.id === id);
        if (!encontrado) setError("Ese botón no está vinculado a tu cuenta.");
        setBoton(encontrado ?? null);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const cuando = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("es-MX") : null;

  // Un botón que nunca mandó su estado: es la diferencia entre "está mal" y
  // "todavía no lo conectas".
  const sinReportar = Boolean(boton && !boton.ultimaSenal);

  return (
    <Pantalla titulo={boton?.nombre ?? "Botón"}>
      {error && (
        <p
          className="mb-3 rounded-xl px-3 py-2 text-sm"
          style={{ background: "var(--superficie)", color: "var(--peligro)" }}
        >
          {error}
        </p>
      )}

      {boton && (
        <>
          <div className="tarjeta p-3">
            <div
              className="trazo mb-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: "var(--fondo)" }}
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold uppercase" style={{ color: "var(--texto)" }}>
                  📍 Dirección
                </span>
                <span className="block truncate text-sm" style={{ color: "var(--texto-tenue)" }}>
                  {boton.direccion ?? "Sin dirección registrada"}
                </span>
              </span>
              <span
                className="trazo shrink-0 rounded-md px-2 py-1 text-[10px] font-bold uppercase"
                style={{ color: "var(--texto)" }}
              >
                {ETIQUETA_ESTADO[boton.estado] ?? boton.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Dato
                titulo="Última señal"
                valor={tiempoRelativo(boton.ultimaSenal)}
                nota={cuando(boton.ultimaSenal) ?? undefined}
              />
              <Dato titulo="Red activa" valor={boton.redActiva} />
              <Dato
                titulo="Señal Wi-Fi"
                valor={boton.rssi != null ? `${boton.rssi} dBm` : null}
                nota={boton.rssi != null ? etiquetaSenal(boton.rssi) : undefined}
              />
              <Dato titulo="IP" valor={boton.ip} />
              <Dato
                titulo="Última alerta"
                valor={
                  boton.grupo
                    ? (tiempoRelativo(boton.ultimaAlerta) ?? "Ninguna todavía")
                    : "Sin grupo"
                }
                nota={boton.grupo ? "En el chat del grupo" : undefined}
              />
              <Dato
                titulo="Firmware"
                valor={boton.firmware}
                nota={
                  boton.fallosInternet > 0
                    ? `${boton.fallosInternet} fallos de internet`
                    : boton.bateria != null
                      ? `Batería ${boton.bateria}%`
                      : undefined
                }
              />
            </div>
          </div>

          <button
            onClick={() => navigate(`/dispositivos/${boton.id}/configurar`)}
            className="trazo mt-4 w-full rounded-2xl py-3 text-sm font-bold uppercase"
            style={{ background: "var(--fondo)", color: "var(--texto)", boxShadow: "4px 4px 0 var(--sombra)" }}
          >
            Configurar botón
          </button>

          <p className="mt-3 text-center text-[11px]" style={{ color: "var(--texto-tenue)" }}>
            {sinReportar
              ? "Red, IP, señal y fallos los reporta el botón físico. Aparecerán en cuanto el aparato se conecte por primera vez."
              : `El botón se reporta cada ${Math.round(boton.intervaloSenal / 60) || 1} min. Si deja de hacerlo, aquí sale "sin conexión".`}
          </p>
        </>
      )}
    </Pantalla>
  );
}
