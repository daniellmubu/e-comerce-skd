import api from "./api";

export async function listarCategorias() {
  const { data } = await api.get("/categorias");
  return data;
}

export async function obtenerCategoriaPorId(id) {
  const { data } = await api.get(`/categorias/${id}`);
  return data;
}

export async function crearCategoria(categoria) {
  const { data } = await api.post("/categorias", categoria);
  return data;
}

export async function actualizarCategoria(id, categoria) {
  const { data } = await api.put(`/categorias/${id}`, categoria);
  return data;
}

export async function eliminarCategoria(id) {
  await api.delete(`/categorias/${id}`);
}
