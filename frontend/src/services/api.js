import axios from "axios";

// En producción, VITE_API_URL debe apuntar al backend (ej. https://backend.onrender.com).
// Si se configura solo la raíz (sin /api), se agrega el sufijo para que las rutas
// /auth/login, /productos, etc. resuelvan contra /api/... del backend.
const raizApi = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");
const api = axios.create({
  baseURL: raizApi.endsWith("/api") ? raizApi : `${raizApi}/api`,
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

  // Errores de validación con formato { message: "Error de validación", fields: { campo: "mensaje" } }
  if (data.fields && typeof data.fields === "object") {
    const primer = Object.values(data.fields)[0];
    if (primer && typeof primer === "string") {
      return primer;
    }
  }

  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  // Fallback: objeto plano { campo: "mensaje" }
  const primeraClave = Object.keys(data)[0];
  if (primeraClave && typeof data[primeraClave] === "string") {
    return data[primeraClave];
  }

  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/**
 * Para la IA: nunca mostrar trazas técnicas al usuario.
 * Si el mensaje es de validación amigable lo conserva, si parece técnico
 * (Cloudflare, Exception, stack trace, muy largo) lo reemplaza por uno genérico.
 */
export function getMensajeAmigableIA(error) {
  const raw = getErrorMessage(error);
  const lower = raw.toLowerCase();

  // Mensajes que SÍ son amigables y deben mostrarse tal cual (validación de negocio)
  const permitidos = [
    "límite",
    "alcanzaste",
    "descripción",
    "muy larga",
    "debes escribir",
    "contenido no permitido",
    "máximo",
    "tardó demasiado",
  ];
  if (permitidos.some((p) => lower.includes(p))) {
    return raw;
  }

  // Si es error de red sin respuesta, también genérico de IA
  if (!error?.response) {
    console.error("IA error de red/técnico ocultado:", raw, error);
    return "Ocurrió un error al generar el diseño. Inténtalo de nuevo más tarde.";
  }

  // Todo lo demás que parezca técnico o largo -> genérico
  const pareceTecnico =
    lower.includes("cloudflare") ||
    lower.includes("exception") ||
    lower.includes("internal") ||
    lower.includes("stack") ||
    lower.includes("at ") ||
    lower.includes("nullpointer") ||
    lower.includes("timeout") ||
    lower.includes("500") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("404") ||
    raw.length > 140;

  if (pareceTecnico) {
    console.error("IA error técnico ocultado:", raw, error);
    return "Ocurrió un error al generar el diseño. Inténtalo de nuevo más tarde.";
  }

  // Por defecto, para IA siempre genérico salvo los permitidos arriba
  console.error("IA error ocultado (fallback genérico):", raw);
  return "Ocurrió un error al generar el diseño. Inténtalo de nuevo más tarde.";
}

export default api;