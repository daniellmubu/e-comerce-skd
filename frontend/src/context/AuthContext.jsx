import { createContext, useContext, useCallback, useState } from "react";

import { obtenerUsuarioActual, logout as logoutService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => obtenerUsuarioActual());

  // Se llama después de un login/registro exitoso, cuando authService
  // ya guardó la sesión en localStorage, para que el estado de React
  // (y por lo tanto la UI, como el Navbar) se entere de inmediato.
  const actualizarSesion = useCallback(() => {
    setUsuario(obtenerUsuarioActual());
  }, []);

  const cerrarSesion = useCallback(() => {
    logoutService();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, actualizarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}