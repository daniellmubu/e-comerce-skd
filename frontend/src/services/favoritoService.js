import api from "./api";

export async function agregarFavorito(productoId) {
  const { data } = await api.post(`/favoritos/${productoId}`);
  return data;
}

export async function eliminarFavorito(productoId) {
  await api.delete(`/favoritos/${productoId}`);
}

export async function listarMisFavoritos(page = 0, size = 10) {
  const { data } = await api.get("/favoritos/mios", {
    params: { page, size },
  });
  return data;
}