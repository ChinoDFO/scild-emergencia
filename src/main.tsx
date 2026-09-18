import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Service worker único de la app (src/sw/sw.ts): hace la PWA instalable,
// permite abrirla sin red y recibe las alertas push con la app cerrada.
// Registrarlo al arrancar (y no hasta que el usuario activa notificaciones)
// es lo que permite que el navegador ofrezca "Instalar app".
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
