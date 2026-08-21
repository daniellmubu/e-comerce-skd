import api from "./axios";

// GET /api/admin/categorias (paginado)
// Respuesta: Page<CategoriaResponse> = { content, totalElements, totalPages, number, size }
// CategoriaResponse: { id, nombre, descripcion, categoriaPadreId }
export async function listarCategorias(page = 0, size = 100) {
  const { data } = await api.get("/admin/categorias", {
    params: { page, size },
  });
  return data;
}

export async function obtenerCategoriaPorId(id) {
  const { data } = await api.get(`/admin/categorias/${id}`);
  return data;
}

// Body: { nombre, descripcion, categoriaPadreId }
export async function crearCategoria(categoria) {
  const { data } = await api.post("/admin/categorias", categoria);
  return data;
}

export async function actualizarCategoria(id, categoria) {
  const { data } = await api.put(`/admin/categorias/${id}`, categoria);
  return data;
}

export async function eliminarCategoria(id) {
  await api.delete(`/admin/categorias/${id}`);
}
