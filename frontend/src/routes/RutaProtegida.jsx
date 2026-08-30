import { Navigate, useLocation } from "react-router-dom";

import { estaAutenticado, obtenerUsuarioActual } from "../services/authService";

function destinoSegunRol(rol) {
  if (rol === "disenador") return "/disenador";
  return "/";
}

/**
 * Protege las rutas de la tienda.
 *
 * - Sin sesión: redirige a /login guardando la ruta de origen.
 * - Con sesión pero sin un rol permitido (prop `roles`): redirige a una
 *   página acorde a su rol (el diseñador a su panel, el resto al inicio).
 *
 * Ocultar botones NO es seguridad; la seguridad real la impone Spring
 * Security en el backend. Esto solo complementa la UX.
 */
function RutaProtegida({ children, roles }) {
  const location = useLocation();

  if (!estaAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const usuario = obtenerUsuarioActual();
    const rol = usuario?.rol;

    if (!roles.includes(rol)) {
      return <Navigate to={destinoSegunRol(rol)} replace />;
    }
  }

  return children;
}

export default RutaProtegida;
