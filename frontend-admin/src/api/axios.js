import axios from "axios";

// Cliente HTTP compartido del panel admin.
// Usa claves de sesión propias (skd_admin_*) para no mezclarse
// con la sesión del frontend público (skd_*).
const TOKEN_KEY = "skd_admin_token";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Inyecta el Access Token en cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ante un 401 (token inválido/expirado) limpia la sesión y vuelve al login.
// Nota: el backend NO tiene endpoint de refresh token, así que no se
// intenta renovar; se pide iniciar sesión de nuevo.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("skd_admin_token");
      localStorage.removeItem("skd_admin_refresh_token");
      localStorage.removeItem("skd_admin_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extrae un mensaje de error legible desde una respuesta de Axios/Spring Boot.
 * Soporta validaciones @Valid (objeto con campo -> mensaje) y errores de
 * negocio simples (message / error).
 */
export function getErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Ocurrió un error de conexión. Intenta de nuevo.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  const primeraClave = Object.keys(data)[0];
  if (primeraClave && typeof data[primeraClave] === "string") {
    return data[primeraClave];
  }

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default api;
