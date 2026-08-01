import api from "./api";

export async function listarEmpaques() {
  const { data } = await api.get("/empaques");
  return data;
}
