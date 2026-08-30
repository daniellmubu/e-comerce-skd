import api from "./api";

export async function enviarMensajeContacto({ nombre, correo, asunto, mensaje }) {
  const { data } = await api.post("/contacto", {
    nombre,
    correo,
    asunto,
    mensaje,
  });
  return data;
}