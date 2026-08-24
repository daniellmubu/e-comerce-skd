import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("skd_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("skd_token");
      localStorage.removeItem("skd_refresh_token");
      localStorage.removeItem("skd_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

/**
 * Extrae un mensaje de error legible desde una respuesta de Axios/Spring Boot.
 * Soporta errores de validación de @Valid (objeto con un campo por error)
 * y mensajes de negocio simples (string en `message` o `error`).
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

  // Errores de validación de Spring (@Valid): objeto { campo: "mensaje" }
  const primeraClave = Object.keys(data)[0];
  if (primeraClave && typeof data[primeraClave] === "string") {
    return data[primeraClave];
  }

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default api;