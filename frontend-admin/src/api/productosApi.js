import api from "./axios";

// GET /api/admin/productos (paginado + filtros opcionales)
// Respuesta: Page<ProductoResponse> = { content, totalElements, totalPages, number, size }
// ProductoResponse: { id, nombre, descripcion, precio, stock, activo, masVendido,
//   categoria, promedioCalificacion, cantidadResenas, esFavorito }
export async function listarProductos({
  page = 0,
  size = 10,
  nombre,
  categoriaId,
  activo,
  precioMin,
  precioMax,
} = {}) {
  const { data } = await api.get("/admin/productos", {
    params: { page, size, nombre, categoriaId, activo, precioMin, precioMax },
  });
  return data;
}

export async function obtenerProductoPorId(id) {
  const { data } = await api.get(`/admin/productos/${id}`);
  return data;
}

// Body: { nombre, descripcion, precio, stock, activo, masVendido, categoriaId }
export async function crearProducto(producto) {
  const { data } = await api.post("/admin/productos", producto);
  return data;
}

export async function actualizarProducto(id, producto) {
  const { data } = await api.put(`/admin/productos/${id}`, producto);
  return data;
}

// Borrado lógico (activo = false)
export async function eliminarProducto(id) {
  await api.delete(`/admin/productos/${id}`);
}

// Restaurar borrado lógico (activo = true)
export async function restaurarProducto(id) {
  await api.patch(`/admin/productos/${id}/restaurar`);
}
