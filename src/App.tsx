import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PerfilProvider } from "./context/PerfilContext";
import { TemaProvider } from "./context/TemaContext";
import AlarmaEnPantalla from "./components/AlarmaEnPantalla";
import RutaProtegida from "./components/RutaProtegida";
import Splash from "./components/Splash";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Recuperar from "./pages/Recuperar";

// Todo lo de ADENTRO de la app (no el login) carga bajo demanda: antes era
// un solo archivo de ~600KB sin importar a qué pantalla se entrara —hasta
// para ver un chat se bajaba el panel de Admin, Ayuda, configurar un
// botón, etc.—. Con esto cada pantalla pesa solo lo suyo, y lo que no se
// visita en una sesión (Admin, Ayuda, Legal...) ni se descarga. El login no
// entra aquí: siempre hace falta de una, así que cargarlo aparte solo
// sumaría un parpadeo más para quien todavía no tiene sesión.
const Perfil = lazy(() => import("./pages/Perfil"));
const Grupos = lazy(() => import("./pages/Grupos"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Dispositivos = lazy(() => import("./pages/Dispositivos"));
const Dispositivo = lazy(() => import("./pages/Dispositivo"));
const ConfigurarBoton = lazy(() => import("./pages/ConfigurarBoton"));
const Grupo = lazy(() => import("./pages/Grupo"));
const Ayuda = lazy(() => import("./pages/Ayuda"));
const Legal = lazy(() => import("./pages/Legal"));
const Codigos = lazy(() => import("./pages/Codigos"));
const Admin = lazy(() => import("./pages/Admin"));

export default function App() {
  return (
    <TemaProvider>
      <AuthProvider>
      <PerfilProvider>
      <BrowserRouter>
        {/* Fuera de las rutas: una alerta puede llegar en cualquier pantalla. */}
        <AlarmaEnPantalla />
        {/* Mismo logo pulsando de la pantalla de carga mientras se
            descarga la pantalla pedida — no un spinner distinto. */}
        <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar" element={<Recuperar />} />
          <Route path="/" element={<Navigate to="/grupos" replace />} />
          <Route
            path="/perfil"
            element={
              <RutaProtegida>
                <Perfil />
              </RutaProtegida>
            }
          />
          <Route
            path="/grupos"
            element={
              <RutaProtegida>
                <Grupos />
              </RutaProtegida>
            }
          />
          <Route
            path="/dispositivos"
            element={
              <RutaProtegida>
                <Dispositivos />
              </RutaProtegida>
            }
          />
          <Route
            path="/dispositivos/:id"
            element={
              <RutaProtegida>
                <Dispositivo />
              </RutaProtegida>
            }
          />
          <Route
            path="/dispositivos/:id/configurar"
            element={
              <RutaProtegida>
                <ConfigurarBoton />
              </RutaProtegida>
            }
          />
          <Route
            path="/configuracion"
            element={
              <RutaProtegida>
                <Configuracion />
              </RutaProtegida>
            }
          />
          <Route
            path="/ayuda"
            element={
              <RutaProtegida>
                <Ayuda />
              </RutaProtegida>
            }
          />
          <Route
            path="/legal"
            element={
              <RutaProtegida>
                <Legal />
              </RutaProtegida>
            }
          />
          <Route
            path="/codigos"
            element={
              <RutaProtegida>
                <Codigos />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin"
            element={
              <RutaProtegida>
                <Admin />
              </RutaProtegida>
            }
          />
          <Route
            path="/grupos/:id"
            element={
              <RutaProtegida>
                <Grupo />
              </RutaProtegida>
            }
          />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </PerfilProvider>
      </AuthProvider>
    </TemaProvider>
  );
}
