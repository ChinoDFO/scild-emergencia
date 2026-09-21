import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pantalla from "../components/Pantalla";
import { obtenerAcceso, type BotonDeAcceso } from "../services/api";

// La pantalla de un botón: dirección con su estado arriba, y debajo la
// cuadrícula de seis datos del diseño.
//
// Cuatro de esos seis (red activa, IP, señal WiFi y fallos del firmware) solo
// los puede reportar el ESP32, que todavía no existe. Se dibujan igual, con
// "Sin datos" en gris: la tarjeta vacía dice la verdad —que no ha llegado esa
// información— mientras que esconderla haría pensar que no está planeada.

const ETIQUETA_ESTADO: Record<string, string> = {
  ONLINE: "En línea",
  IRREGULAR: "Señal irregular",
  OFFLINE: "Sin conexión",
  EMERGENCY: "Emergencia",
  MAINTENANCE: "Mantenimiento",
};

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
              <Dato titulo="Última señal" valor={cuando(boton.ultimaSenal)} />
              <Dato titulo="Red activa" />
              <Dato titulo="Señal Wi-Fi" nota="(Buena, mala, excelente)" />
              <Dato titulo="IP" />
              <Dato
                titulo="Última alerta"
                valor={boton.grupo ? null : "Sin grupo"}
                nota={boton.grupo ? "En el chat del grupo" : undefined}
              />
              <Dato
                titulo="Firmware"
                valor={boton.firmware}
                nota={boton.bateria != null ? `Batería ${boton.bateria}%` : undefined}
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
            Red, IP, señal y fallos los reporta el botón físico. Aparecerán en cuanto el aparato
            empiece a mandar su estado.
          </p>
        </>
      )}
    </Pantalla>
  );
}
