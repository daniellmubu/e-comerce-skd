import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Productos from "../pages/Productos";
import Categorias from "../pages/Categorias";
import Usuarios from "../pages/Usuarios";
import Pedidos from "../pages/Pedidos";
import Cupones from "../pages/Cupones";
import Empaques from "../pages/Empaques";
import Placeholder from "../pages/Placeholder";

function AppRoutes() {
  return (
    <Routes>
      {/* Login público */}
      <Route path="/login" element={<Login />} />

      {/* Panel admin protegido */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Módulos que se irán implementando por fase */}
        <Route path="productos" element={<Productos />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="cupones" element={<Cupones />} />
        <Route path="empaques" element={<Empaques />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route
          path="tarifas-envio"
          element={<Placeholder titulo="Tarifas de envío" descripcion="CRUD de tarifas de envío (Fase 9)." />}
        />
        <Route
          path="reportes"
          element={<Placeholder titulo="Reportes" descripcion="Reportes y exportaciones (Fases 10-11)." />}
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
