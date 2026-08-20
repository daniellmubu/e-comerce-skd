import api from "./api";

export async function listarCupones() {
  const { data } = await api.get("/cupones");
  return data;
}

export async function listarMisCupones() {
  const { data } = await api.get("/cupones/mios");
  return data;
}
