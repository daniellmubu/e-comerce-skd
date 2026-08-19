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
import MisPedidos from "../pages/MisPedidos";
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
        path="/mis-pedidos"
        element={
          <RutaProtegida>
            <MisPedidos />
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