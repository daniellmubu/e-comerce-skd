import api from "./api";

export async function listarGaleria(page = 0, size = 12) {
  const { data } = await api.get("/galeria-clientes", { params: { page, size } });
  return data;
}