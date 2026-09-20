// Sirena de la app, para cuando la alerta llega con la PWA abierta.
//
// Por qué se genera el sonido en vez de reproducir un mp3: una notificación
// del sistema no puede traer sonido propio en la web (la propiedad "sound"
// del estándar no la implementó ningún navegador), así que la única sirena
// posible es la que toca la página mientras está abierta. Y generarla con el
// oscilador del navegador evita cargar un archivo: suena igual sin red, no
// pesa en la instalación y no hay nada que se pueda quedar a medio descargar
// justo cuando se ocupa.
//
// El sonido es el de siempre: un tono que sube y baja, hecho con un
// oscilador grave modulado por otro lento.

const FRECUENCIA_BASE = 750; // Hz, el centro del barrido
const BARRIDO = 250; // Hz arriba y abajo del centro
const VELOCIDAD_BARRIDO = 2.5; // veces por segundo
const VOLUMEN = 0.22;
const SUBIDA_MS = 60; // rampa para que no truene al empezar

// Se apaga sola: si nadie la calla (el celular quedó en la mesa) tampoco
// tiene caso que siga sonando indefinidamente.
const MAXIMO_MS = 60_000;

// vibrate() no repite un patrón, así que se vuelve a pedir cada tanto.
const PATRON_VIBRACION = [400, 200, 400, 200, 400, 600];
const CICLO_VIBRACION_MS = 2_200;

let audio: AudioContext | null = null;
let sonando: { osc: OscillatorNode; lfo: OscillatorNode; volumen: GainNode } | null = null;
let vibracion: ReturnType<typeof setInterval> | null = null;
let apagadoAutomatico: ReturnType<typeof setTimeout> | null = null;

// El navegador no deja crear ni reanudar audio sin que la persona haya
// tocado la página antes. Esto lo hace en el primer toque, mucho antes de
// que llegue ninguna alerta: si se dejara para el momento de la emergencia,
// la sirena simplemente no sonaría.
export function prepararSirena() {
  const desbloquear = () => {
    try {
      audio ??= new AudioContext();
      void audio.resume();
    } catch {
      // Navegador sin Web Audio: la alerta igual se ve en pantalla.
    }
  };

  for (const evento of ["pointerdown", "keydown"] as const) {
    window.addEventListener(evento, desbloquear, { once: true, passive: true });
  }
}

export function sirenaSonando() {
  return sonando !== null;
}

export function sonarSirena() {
  if (sonando) return;

  try {
    audio ??= new AudioContext();
    // Si la pestaña estaba en segundo plano el contexto puede venir suspendido.
    void audio.resume();

    const ahora = audio.currentTime;

    const volumen = audio.createGain();
    volumen.gain.setValueAtTime(0.0001, ahora);
    volumen.gain.exponentialRampToValueAtTime(VOLUMEN, ahora + SUBIDA_MS / 1000);
    volumen.connect(audio.destination);

    const osc = audio.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(FRECUENCIA_BASE, ahora);
    osc.connect(volumen);

    // El que hace el "uuuu-iiii": mueve la frecuencia del primero.
    const lfo = audio.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(VELOCIDAD_BARRIDO, ahora);
    const profundidad = audio.createGain();
    profundidad.gain.setValueAtTime(BARRIDO, ahora);
    lfo.connect(profundidad).connect(osc.frequency);

    osc.start();
    lfo.start();
    sonando = { osc, lfo, volumen };
  } catch {
    // Sin audio queda la vibración y el aviso en pantalla.
  }

  const vibrar = () => navigator.vibrate?.(PATRON_VIBRACION);
  vibrar();
  vibracion = setInterval(vibrar, CICLO_VIBRACION_MS);

  apagadoAutomatico = setTimeout(callarSirena, MAXIMO_MS);
}

export function callarSirena() {
  if (vibracion) {
    clearInterval(vibracion);
    vibracion = null;
    navigator.vibrate?.(0);
  }
  if (apagadoAutomatico) {
    clearTimeout(apagadoAutomatico);
    apagadoAutomatico = null;
  }
  if (!sonando) return;

  const { osc, lfo, volumen } = sonando;
  sonando = null;
  try {
    const fin = (audio?.currentTime ?? 0) + SUBIDA_MS / 1000;
    volumen.gain.exponentialRampToValueAtTime(0.0001, fin);
    osc.stop(fin);
    lfo.stop(fin);
  } catch {
    // Ya estaba detenido.
  }
}
