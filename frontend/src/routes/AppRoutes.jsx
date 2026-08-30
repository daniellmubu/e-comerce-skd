import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import Loading from "../components/ui/Loading";
import RutaProtegida from "./RutaProtegida";

const ROLES_CLIENTE = ["admin", "cliente"];
const ROLES_DISENADOR = ["admin", "disenador"];

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Registro = lazy(() => import("../pages/Registro"));
const OlvidePassword = lazy(() => import("../pages/OlvidePassword"));
const RestablecerPassword = lazy(() => import("../pages/RestablecerPassword"));
const Catalogo = lazy(() => import("../pages/Catalogo"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Generador = lazy(() => import("../pages/Generador"));
const Personalizador = lazy(() => import("../pages/Personalizador"));
const Carrito = lazy(() => import("../pages/Carrito"));
const Checkout = lazy(() => import("../pages/Checkout"));
const CheckoutResultado = lazy(() => import("../pages/CheckoutResultado"));
const MisPedidos = lazy(() => import("../pages/MisPedidos"));
const MisCupones = lazy(() => import("../pages/MisCupones"));
const MisFavoritos = lazy(() => import("../pages/MisFavoritos"));
const MisDisenos = lazy(() => import("../pages/MisDisenos"));
const Bandeja = lazy(() => import("../pages/Bandeja"));
const GaleriaClientes = lazy(() => import("../pages/GaleriaClientes"));
const SolicitarDiseno = lazy(() => import("../pages/SolicitarDiseno"));
const PanelDisenador = lazy(() => import("../pages/PanelDisenador"));
const DetalleProducto = lazy(() => import("../pages/DetalleProducto"));
const SeguimientoPedido = lazy(() => import("../pages/SeguimientoPedido"));
const Creditos = lazy(() => import("../pages/Creditos"));

function Pagina({ children }) {
  return <Suspense fallback={<Loading label="Cargando…" />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Pagina><Home /></Pagina>} />
      <Route path="/catalogo" element={<Pagina><Catalogo /></Pagina>} />
      <Route path="/productos/:id" element={<Pagina><DetalleProducto /></Pagina>} />
      <Route path="/login" element={<Pagina><Login /></Pagina>} />
      <Route path="/registro" element={<Pagina><Registro /></Pagina>} />
      <Route path="/olvide-password" element={<Pagina><OlvidePassword /></Pagina>} />
      <Route path="/restablecer-password" element={<Pagina><RestablecerPassword /></Pagina>} />
      <Route
        path="/dashboard"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Dashboard />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route path="/generador" element={<Pagina><Generador /></Pagina>} />
      <Route path="/personalizador" element={<Pagina><Personalizador /></Pagina>} />
      <Route path="/galeria-clientes" element={<Pagina><GaleriaClientes /></Pagina>} />
      <Route path="/creditos" element={<Pagina><Creditos /></Pagina>} />
      <Route
        path="/carrito"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Carrito />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/checkout"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Checkout />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/checkout/resultado"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <CheckoutResultado />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-pedidos"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisPedidos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-cupones"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisCupones />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-favoritos"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisFavoritos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-disenos"
        element={
          <Pagina>
            <RutaProtegida>
              <MisDisenos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/solicitar-diseno"
        element={
          <Pagina>
            <RutaProtegida>
              <SolicitarDiseno />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/disenador"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_DISENADOR}>
              <PanelDisenador />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/bandeja"
        element={
          <Pagina>
            <RutaProtegida>
              <Bandeja />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/pedidos/:id/seguimiento"
        element={
          <Pagina>
            <RutaProtegida roles={ROLES_CLIENTE}>
              <SeguimientoPedido />
            </RutaProtegida>
          </Pagina>
        }
      />
    </Routes>
  );
}

export default AppRoutes;