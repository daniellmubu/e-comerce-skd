import api from "./api";

export async function listarCupones() {
  const { data } = await api.get("/cupones");
  return data;
}
