import api from "./api";

export async function listarNotificaciones() {
  const { data } = await api.get("/notificaciones");
  return data;
}

export async function contarNoLeidas() {
  const { data } = await api.get("/notificaciones/no-leidas");
  return data;
}

export async function marcarLeida(id) {
  await api.patch(`/notificaciones/${id}/leida`);
}

export async function marcarTodasLeidas() {
  await api.patch("/notificaciones/leidas");
}