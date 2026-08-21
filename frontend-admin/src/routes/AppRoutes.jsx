import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Productos from "../pages/Productos";
import Categorias from "../pages/Categorias";
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
        <Route
          path="cupones"
          element={<Placeholder titulo="Cupones" descripcion="CRUD de cupones (Fase 7)." />}
        />
        <Route
          path="empaques"
          element={<Placeholder titulo="Empaques" descripcion="CRUD de empaques (Fase 8)." />}
        />
        <Route
          path="pedidos"
          element={<Placeholder titulo="Pedidos" descripcion="Gestión de pedidos (Fase 6)." />}
        />
        <Route
          path="usuarios"
          element={<Placeholder titulo="Usuarios" descripcion="Administración de usuarios (Fase 5)." />}
        />
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
