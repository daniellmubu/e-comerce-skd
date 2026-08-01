import { Navigate, useLocation } from "react-router-dom";

import { estaAutenticado } from "../services/authService";

function RutaProtegida({ children }) {
  const location = useLocation();

  if (!estaAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RutaProtegida;