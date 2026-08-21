import { createContext, useContext, useCallback, useState } from "react";

import { login as loginApi } from "../api/authApi";

const AuthContext = createContext(null);

// Claves propias del admin (no comparte sesión con la tienda).
const TOKEN_KEY = "skd_admin_token";
const REFRESH_TOKEN_KEY = "skd_admin_refresh_token";
const USER_KEY = "skd_admin_user";

function guardarSesion(authResponse) {
  // Separamos el token del resto de datos del usuario.
  const { token, refreshToken, ...usuario } = authResponse;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function leerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  const login = useCallback(async (username, password) => {
    const data = await loginApi(username, password);

    // Validación de rol: el panel es exclusivo para administradores.
    // (La seguridad real la impone Spring Security en /api/admin/**).
    if (data.rol !== "admin") {
      throw new Error(
        "Acceso denegado. Este panel es solo para administradores."
      );
    }

    guardarSesion(data);
    setUsuario(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    limpiarSesion();
    setUsuario(null);
  }, []);

  const esAdmin = usuario?.rol === "admin";

  return (
    <AuthContext.Provider value={{ usuario, esAdmin, login, logout }}>
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
