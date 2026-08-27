import api from "./axios";

// GET /api/admin/resenas (paginado, filtro opcional por estado)
// Respuesta: Page<ResenaResponse> = { content, totalElements, totalPages, number, size }
// ResenaResponse: { id, productoId, productoNombre, usuarioId, usuarioNombre,
//   calificacion, comentario, imagenUrl, estado, creadoEn, compraVerificada }
export async function listarResenas({ page = 0, size = 10, estado } = {}) {
  const { data } = await api.get("/admin/resenas", {
    params: { page, size, estado },
  });
  return data;
}

// PATCH /api/admin/resenas/{id}/aprobar
export async function aprobarResena(id) {
  const { data } = await api.patch(`/admin/resenas/${id}/aprobar`);
  return data;
}

// PATCH /api/admin/resenas/{id}/rechazar
export async function rechazarResena(id) {
  const { data } = await api.patch(`/admin/resenas/${id}/rechazar`);
  return data;
}

// DELETE /api/admin/resenas/{id}
export async function eliminarResena(id) {
  await api.delete(`/admin/resenas/${id}`);
}
