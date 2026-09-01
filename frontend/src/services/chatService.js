import api from "./api";

/**
 * Envía un mensaje al chatbot (público, sin JWT).
 * @param {string} mensaje - mensaje actual (max 500)
 * @param {Array<{rol: string, texto: string}>} historial - hasta 20 mensajes previos en formato {rol: "user"|"model", texto}
 */
export async function enviarMensajeChat(mensaje, historial = []) {
  const { data } = await api.post("/chat", { mensaje, historial });
  return data;
}
