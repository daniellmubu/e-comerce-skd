import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

/**
 * Protege las rutas administrativas.
 *
 * - Sin sesión: redirige a /login guardando la ruta de origen.
 * - Con sesión pero sin rol admin: redirige a /login (acceso denegado).
 *
 * Ocultar botones NO es seguridad: la seguridad real la impone
 * Spring Security en /api/admin/**; esto solo complementa la UX.
 */
function ProtectedRoute({ children }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (usuario.rol !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
