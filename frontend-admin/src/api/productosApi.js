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

// Ajusta el precio de varios productos aplicando un porcentaje.
// Body: { ids: number[], porcentaje: number }
// Respuesta: { actualizados: number, porcentaje: number }
export async function ajustarPrecios(ids, porcentaje) {
  const { data } = await api.patch("/admin/productos/precios", {
    ids,
    porcentaje,
  });
  return data;
}

// Sube la imagen del producto (multipart/form-data) y la establece
// como imagen principal. Respuesta: ProductoResponse actualizado.
// Nota: se anula el Content-Type para que el navegador lo establezca
// con el boundary adecuado (la instancia axios trae application/json).
export async function subirImagenProducto(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/admin/productos/${id}/imagen`, formData, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

// GET /api/imagenes/producto/{productoId} -> [{ id, productoId, url, esPrincipal }]
// Endpoint público; devuelve todas las imágenes de la galería del producto.
export async function listarImagenesProducto(productoId) {
  const { data } = await api.get(`/imagenes/producto/${productoId}`);
  return data;
}

// POST /api/admin/productos/{id}/imagenes -> añade una imagen más a la galería
// (no reemplaza las existentes; la primera subida queda como principal).
export async function agregarImagenProducto(id, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/admin/productos/${id}/imagenes`, formData, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

// PATCH /api/admin/productos/imagenes/{imagenId}/principal -> marca la imagen como principal.
export async function marcarImagenPrincipal(imagenId) {
  const { data } = await api.patch(
    `/admin/productos/imagenes/${imagenId}/principal`
  );
  return data;
}

// DELETE /api/admin/productos/imagenes/{imagenId} -> elimina la imagen de la galería.
export async function eliminarImagenProducto(imagenId) {
  await api.delete(`/admin/productos/imagenes/${imagenId}`);
}
