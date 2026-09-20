import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { prepararSirena } from './services/sirena'

// Service worker único de la app (src/sw/sw.ts): hace la PWA instalable,
// permite abrirla sin red y recibe las alertas push con la app cerrada.
// Registrarlo al arrancar (y no hasta que el usuario activa notificaciones)
// es lo que permite que el navegador ofrezca "Instalar app".
registerSW({ immediate: true })

// Deja listo el audio de la sirena en el primer toque de la persona. El
// navegador no permite empezar a sonar sin un gesto previo, así que esperar
// a que llegue la alerta sería tarde.
prepararSirena()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
