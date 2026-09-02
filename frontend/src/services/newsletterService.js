import api from "./api";

export async function suscribirNewsletter(correo) {
  const { data } = await api.post("/newsletter", { correo });
  return data;
}
