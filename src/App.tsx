import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TemaProvider } from "./context/TemaContext";
import AlarmaEnPantalla from "./components/AlarmaEnPantalla";
import RutaProtegida from "./components/RutaProtegida";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Recuperar from "./pages/Recuperar";
import Perfil from "./pages/Perfil";
import Grupos from "./pages/Grupos";
import Configuracion from "./pages/Configuracion";
import Dispositivos from "./pages/Dispositivos";
import Dispositivo from "./pages/Dispositivo";
import ConfigurarBoton from "./pages/ConfigurarBoton";
import Grupo from "./pages/Grupo";
import Ayuda from "./pages/Ayuda";
import Codigos from "./pages/Codigos";

export default function App() {
  return (
    <TemaProvider>
      <AuthProvider>
      <BrowserRouter>
        {/* Fuera de las rutas: una alerta puede llegar en cualquier pantalla. */}
        <AlarmaEnPantalla />
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
            path="/codigos"
            element={
              <RutaProtegida>
                <Codigos />
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
      </BrowserRouter>
      </AuthProvider>
    </TemaProvider>
  );
}
