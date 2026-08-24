import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Registro from "../pages/Registro";
import Catalogo from "../pages/Catalogo";
import Dashboard from "../pages/Dashboard";
import Generador from "../pages/Generador";
import Personalizador from "../pages/Personalizador";
import Carrito from "../pages/Carrito";
import Checkout from "../pages/Checkout";
import CheckoutResultado from "../pages/CheckoutResultado";
import MisPedidos from "../pages/MisPedidos";
import MisCupones from "../pages/MisCupones";
import MisFavoritos from "../pages/MisFavoritos";
import SolicitarDiseno from "../pages/SolicitarDiseno";
import PanelDisenador from "../pages/PanelDisenador";
import DetalleProducto from "../pages/DetalleProducto";
import SeguimientoPedido from "../pages/SeguimientoPedido";
import RutaProtegida from "./RutaProtegida";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/productos/:id" element={<DetalleProducto />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <Dashboard />
          </RutaProtegida>
        }
      />
      <Route path="/generador" element={<Generador />} />
      <Route path="/personalizador" element={<Personalizador />} />
      <Route
        path="/carrito"
        element={
          <RutaProtegida>
            <Carrito />
          </RutaProtegida>
        }
      />
      <Route
        path="/checkout"
        element={
          <RutaProtegida>
            <Checkout />
          </RutaProtegida>
        }
      />
      <Route
        path="/checkout/resultado"
        element={
          <RutaProtegida>
            <CheckoutResultado />
          </RutaProtegida>
        }
      />
      <Route
        path="/mis-pedidos"
        element={
          <RutaProtegida>
            <MisPedidos />
          </RutaProtegida>
        }
      />
      <Route
        path="/mis-cupones"
        element={
          <RutaProtegida>
            <MisCupones />
          </RutaProtegida>
        }
      />
      <Route
        path="/mis-favoritos"
        element={
          <RutaProtegida>
            <MisFavoritos />
          </RutaProtegida>
        }
      />
      <Route
        path="/solicitar-diseno"
        element={
          <RutaProtegida>
            <SolicitarDiseno />
          </RutaProtegida>
        }
      />
      <Route
        path="/disenador"
        element={
          <RutaProtegida>
            <PanelDisenador />
          </RutaProtegida>
        }
      />
      <Route
        path="/pedidos/:id/seguimiento"
        element={
          <RutaProtegida>
            <SeguimientoPedido />
          </RutaProtegida>
        }
      />
    </Routes>
  );
}

export default AppRoutes;