import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AlarmaEnPantalla from "./components/AlarmaEnPantalla";
import RutaProtegida from "./components/RutaProtegida";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Inicio from "./pages/Inicio";
import Grupo from "./pages/Grupo";
import Ayuda from "./pages/Ayuda";
import Codigos from "./pages/Codigos";
import Pago from "./pages/Pago";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Fuera de las rutas: una alerta puede llegar en cualquier pantalla. */}
        <AlarmaEnPantalla />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Inicio />
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
            path="/pago"
            element={
              <RutaProtegida>
                <Pago />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
