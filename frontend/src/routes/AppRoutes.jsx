import { Suspense, lazy, useEffect } from "react";
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
const Legal = lazy(() => import("../pages/Legal"));
const Contacto = lazy(() => import("../pages/Contacto"));
const VerificarEmail = lazy(() => import("../pages/VerificarEmail"));
const NoEncontrado = lazy(() => import("../pages/NoEncontrado"));
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
const GaleriaDisenos = lazy(() => import("../pages/GaleriaDisenos"));
const SolicitarDiseno = lazy(() => import("../pages/SolicitarDiseno"));
const PanelDisenador = lazy(() => import("../pages/PanelDisenador"));
const DetalleProducto = lazy(() => import("../pages/DetalleProducto"));
const SeguimientoPedido = lazy(() => import("../pages/SeguimientoPedido"));
const Creditos = lazy(() => import("../pages/Creditos"));

function Pagina({ title, description, children }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  }, [title, description]);
  return <Suspense fallback={<Loading label="Cargando…" />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Pagina title="SKD - Creando Sueños | Productos personalizados" description="Diseña y personaliza tus mugs, jarras, termos y más con IA. Sublimación de calidad en Colombia."><Home /></Pagina>} />
      <Route path="/catalogo" element={<Pagina title="Catálogo | SKD Creando Sueños" description="Explora nuestros productos personalizados: mugs, jarras y más."><Catalogo /></Pagina>} />
      <Route path="/productos/:id" element={<Pagina title="Producto | SKD Creando Sueños"><DetalleProducto /></Pagina>} />
      <Route path="/login" element={<Pagina title="Iniciar sesión | SKD"><Login /></Pagina>} />
      <Route path="/registro" element={<Pagina title="Registro | SKD"><Registro /></Pagina>} />
      <Route path="/olvide-password" element={<Pagina title="Recuperar contraseña | SKD"><OlvidePassword /></Pagina>} />
      <Route path="/restablecer-password" element={<Pagina title="Nueva contraseña | SKD"><RestablecerPassword /></Pagina>} />
      <Route path="/legal/:tipo" element={<Pagina><Legal /></Pagina>} />
      <Route path="/contacto" element={<Pagina title="Contacto | SKD"><Contacto /></Pagina>} />
      <Route path="/verificar-email" element={<Pagina title="Verificar correo | SKD"><VerificarEmail /></Pagina>} />
      <Route
        path="/dashboard"
        element={
          <Pagina title="Mi panel | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Dashboard />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route path="/generador" element={<Pagina title="Generador con IA | SKD"><Generador /></Pagina>} />
      <Route path="/personalizador" element={<Pagina title="Personalizador | SKD"><Personalizador /></Pagina>} />
      <Route path="/galeria-clientes" element={<Pagina title="Galería de clientes | SKD"><GaleriaClientes /></Pagina>} />
      <Route path="/galeria-disenos" element={<Pagina title="Galería de diseños | SKD" description="Explora los diseños publicados por la comunidad, dales me gusta y úsalos en tus productos."><GaleriaDisenos /></Pagina>} />
      <Route path="/creditos" element={<Pagina title="Créditos 3D | SKD"><Creditos /></Pagina>} />
      <Route
        path="/carrito"
        element={
          <Pagina title="Carrito | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Carrito />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/checkout"
        element={
          <Pagina title="Finalizar compra | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <Checkout />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/checkout/resultado"
        element={
          <Pagina title="Finalizar compra | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <CheckoutResultado />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-pedidos"
        element={
          <Pagina title="Mis pedidos | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisPedidos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-cupones"
        element={
          <Pagina title="Mis cupones | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisCupones />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-favoritos"
        element={
          <Pagina title="Mis favoritos | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <MisFavoritos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/mis-disenos"
        element={
          <Pagina title="Mis diseños | SKD">
            <RutaProtegida>
              <MisDisenos />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/solicitar-diseno"
        element={
          <Pagina title="Diseño asistido | SKD">
            <RutaProtegida>
              <SolicitarDiseno />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/disenador"
        element={
          <Pagina title="Panel diseñador | SKD">
            <RutaProtegida roles={ROLES_DISENADOR}>
              <PanelDisenador />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/bandeja"
        element={
          <Pagina title="Bandeja de entrada | SKD">
            <RutaProtegida>
              <Bandeja />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route
        path="/pedidos/:id/seguimiento"
        element={
          <Pagina title="Seguimiento del pedido | SKD">
            <RutaProtegida roles={ROLES_CLIENTE}>
              <SeguimientoPedido />
            </RutaProtegida>
          </Pagina>
        }
      />
      <Route path="*" element={<Pagina title="Página no encontrada | SKD"><NoEncontrado /></Pagina>} />
    </Routes>
  );
}

export default AppRoutes;