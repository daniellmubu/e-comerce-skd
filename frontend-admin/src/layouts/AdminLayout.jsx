import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaBoxOpen,
  FaTags,
  FaTicketAlt,
  FaBox,
  FaClipboardList,
  FaUsers,
  FaTruck,
  FaFileAlt,
} from "react-icons/fa";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: <FaChartLine />, end: true },
  { label: "Productos", to: "/productos", icon: <FaBoxOpen /> },
  { label: "Categorías", to: "/categorias", icon: <FaTags /> },
  { label: "Cupones", to: "/cupones", icon: <FaTicketAlt /> },
  { label: "Empaques", to: "/empaques", icon: <FaBox /> },
  { label: "Pedidos", to: "/pedidos", icon: <FaClipboardList /> },
  { label: "Usuarios", to: "/usuarios", icon: <FaUsers /> },
  { label: "Tarifas de envío", to: "/tarifas-envio", icon: <FaTruck /> },
  { label: "Reportes", to: "/reportes", icon: <FaFileAlt /> },
];

// Mapa para el título dinámico de la barra superior.
const TITULOS = {
  "/dashboard": "Dashboard",
  "/productos": "Productos",
  "/categorias": "Categorías",
  "/cupones": "Cupones",
  "/empaques": "Empaques",
  "/pedidos": "Pedidos",
  "/usuarios": "Usuarios",
  "/tarifas-envio": "Tarifas de envío",
  "/reportes": "Reportes",
};

function AdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageTitle =
    TITULOS[location.pathname] || "SKD Admin";

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900 dark:bg-slate-950 dark:text-white">
      <Sidebar
        items={NAV_ITEMS}
        usuario={usuario}
        onLogout={handleLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
