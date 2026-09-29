import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { escucharAlertasEnPrimerPlano } from "../services/notificaciones";
import { callarSirena, sonarSirena } from "../services/sirena";

type Tipo = "general" | "especifica" | "chat";

interface Alarma {
  titulo: string;
  cuerpo: string;
  groupId: string | null;
  recibidaA: Date;
  tipo: Tipo;
}

// Cuánto se queda en pantalla una alerta de un tipo específico antes de
// cerrarse sola. El SOS y el botón físico NO usan este tiempo: se quedan
// fijos hasta que alguien los atiende o los silencia, porque no se puede dar
// por hecho que una emergencia real ya se vio.
const AUTOCIERRE_MS = 10_000;

// Un mensaje de chat es menos urgente que hasta la alerta más leve: basta con
// que se note un instante.
const AUTOCIERRE_CHAT_MS = 6_000;

// De qué grupo es la conversación abierta ahora mismo, si la hay. Con la ruta
// y no con un estado propio: así no hay que duplicar lo que ya sabe
// Grupo.tsx (que es quien le avisa al BACKEND con avisarGrupoAbierto, para
// que ni intente mandar el push). Aquí hace falta lo mismo pero del lado del
// cliente: mientras esa pantalla siga abierta, el chat ya muestra el mensaje
// solo por el socket, y este aviso encima sería redundante.
function grupoDeLaRuta(pathname: string) {
  return /^\/grupos\/([^/]+)/.exec(pathname)?.[1] ?? null;
}

// Solo el SOS y el botón físico hacen sonar la sirena y se quedan fijos en
// rojo. Los dos mandan una alerta GENERAL ("Emergencia"); los demás tipos del
// menú —carro sospechoso, incendio, emergencia médica...— sí se avisan en
// pantalla y por notificación, en amarillo y sin ruido: una sirena a todo
// volumen por una persona sospechosa en la esquina enseña a la gente a apagar
// la app, y entonces no suena cuando de verdad hace falta. El botón físico se
// acepta también por su origen, por si llega de un servidor que todavía no
// manda el tipo.
function esGeneral(datos: Record<string, string> | undefined) {
  return datos?.type === "GENERAL" || datos?.source === "DEVICE";
}

// Con la PWA abierta el navegador NO dibuja la notificación del sistema, así
// que sin esto una alerta —o un mensaje— que llega mientras alguien usa la
// app pasaría completamente desapercibida. Aquí es además el único lugar
// donde se puede hacer ruido de verdad: una página abierta sí puede tocar una
// sirena, una notificación del sistema no.
//
// Va montado en toda la app (no en una pantalla), porque puede llegar
// estando en cualquier parte.
export default function AlarmaEnPantalla() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [alarma, setAlarma] = useState<Alarma | null>(null);
  const autocierre = useRef<ReturnType<typeof setTimeout> | null>(null);

  // En un ref porque el efecto de abajo se suscribe una sola vez: sin esto,
  // el aviso de mensaje se acordaría para siempre de qué grupo estaba abierto
  // en el primer render, y dejaría de silenciarse al cambiar de chat. Se
  // actualiza en un efecto y no durante el render porque escribir un ref ahí
  // es un efecto secundario que React no espera en esa fase.
  const grupoAbierto = useRef<string | null>(null);
  useEffect(() => {
    grupoAbierto.current = grupoDeLaRuta(pathname);
  }, [pathname]);

  useEffect(() => {
    return escucharAlertasEnPrimerPlano((payload) => {
      const groupId = payload.data?.groupId ?? null;

      if (payload.data?.kind === "chat") {
        // Si esa conversación ya está abierta, el chat muestra el mensaje
        // solo por el socket: este aviso encima sería redundante. Si no,
        // sin esto el mensaje no avisa de ninguna forma —ni aquí ni el
        // sistema, que no dibuja nada mientras la PWA esté visible— y solo
        // se entera quien vuelva a entrar al grupo.
        if (groupId && groupId === grupoAbierto.current) return;

        setAlarma({
          titulo: payload.notification?.title ?? "Mensaje nuevo",
          cuerpo: payload.notification?.body ?? "Tienes un mensaje nuevo",
          groupId,
          recibidaA: new Date(),
          tipo: "chat",
        });
        if (autocierre.current) clearTimeout(autocierre.current);
        autocierre.current = setTimeout(() => setAlarma(null), AUTOCIERRE_CHAT_MS);
        return;
      }

      const general = esGeneral(payload.data);

      setAlarma({
        titulo: payload.notification?.title ?? "🚨 Emergencia",
        cuerpo: payload.notification?.body ?? "Se activó una alerta en tu grupo",
        groupId,
        recibidaA: new Date(),
        tipo: general ? "general" : "especifica",
      });

      // El SOS y el botón físico se quedan fijos: no se puede dar por hecho
      // que ya se vieron. Una alerta de un tipo específico se cierra sola
      // para no quedarse estorbando la pantalla, y por eso NO insiste ni
      // reaparece: llega una vez, se lee, se va.
      if (autocierre.current) clearTimeout(autocierre.current);
      if (!general) {
        autocierre.current = setTimeout(() => setAlarma(null), AUTOCIERRE_MS);
      }

      // Las repeticiones de la misma alerta no reinician nada: si ya está
      // sonando, sonarSirena no hace nada. Y si la persona silenció la
      // sirena en Configuración, tampoco: sonarSirena lo respeta.
      if (general) sonarSirena();
    });
  }, []);

  // Si el componente se desmonta (cierre de sesión) no se queda sonando.
  useEffect(
    () => () => {
      callarSirena();
      if (autocierre.current) clearTimeout(autocierre.current);
    },
    []
  );

  if (!alarma) return null;

  const cerrar = () => {
    if (autocierre.current) clearTimeout(autocierre.current);
    callarSirena();
    setAlarma(null);
  };

  const ver = () => {
    const destino = alarma.groupId ? `/grupos/${alarma.groupId}` : "/";
    cerrar();
    navigate(destino);
  };

  // El SOS/botón físico se ve como una emergencia de verdad (rojo, late sin
  // parar); una alerta de un tipo específico avisa igual de claro pero en
  // amarillo, sin el latido, porque ya sabemos que se va a cerrar sola. Un
  // mensaje de chat no es una alerta: gris oscuro, para que no se confunda
  // con ninguna de las dos.
  const PALETA: Record<Tipo, { caja: string; cuerpo: string; hora: string; ver: string; cerrar: string }> = {
    general: {
      caja: "bg-red-600 text-white ring-1 ring-red-900/20 motion-safe:animate-[latido_1.2s_ease-out_infinite]",
      cuerpo: "text-red-50",
      hora: "text-red-200",
      ver: "bg-white text-red-700 hover:bg-red-50",
      cerrar: "bg-red-800 text-white hover:bg-red-900",
    },
    especifica: {
      caja: "bg-amber-400 text-amber-950 ring-1 ring-amber-700/20",
      cuerpo: "text-amber-900",
      hora: "text-amber-800",
      ver: "bg-white text-amber-800 hover:bg-amber-50",
      cerrar: "bg-amber-600 text-amber-950 hover:bg-amber-700",
    },
    chat: {
      caja: "bg-slate-800 text-white ring-1 ring-slate-900/20",
      cuerpo: "text-slate-200",
      hora: "text-slate-400",
      ver: "bg-white text-slate-800 hover:bg-slate-50",
      cerrar: "bg-slate-700 text-white hover:bg-slate-600",
    },
  };
  const colores = PALETA[alarma.tipo];

  return (
    <div
      role="alertdialog"
      aria-label={alarma.titulo}
      className="fixed inset-x-0 top-0 z-50 flex justify-center p-2 pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <div className={`w-full max-w-lg rounded-2xl p-4 shadow-2xl ${colores.caja}`}>
        <p className="text-lg font-bold">{alarma.titulo}</p>
        <p className={`text-sm ${colores.cuerpo}`}>{alarma.cuerpo}</p>
        <p className={`mt-1 text-xs ${colores.hora}`}>
          {alarma.recibidaA.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}
        </p>

        <div className="mt-3 flex gap-2">
          <button
            onClick={ver}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold ${colores.ver}`}
          >
            {alarma.tipo === "chat" ? "Ver mensaje" : "Ver alerta"}
          </button>
          <button
            onClick={cerrar}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${colores.cerrar}`}
          >
            Silenciar
          </button>
        </div>
      </div>
    </div>
  );
}
