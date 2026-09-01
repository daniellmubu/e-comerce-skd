import api from "./axios";

// GET /api/admin/disenos (paginado, filtros por estado y búsqueda por título)
// Respuesta: Page<DisenoAdminResponse> = { content, totalElements, totalPages, number, size }
export async function listarDisenos({ page = 0, size = 10, estado, busqueda } = {}) {
  const { data } = await api.get("/admin/disenos", {
    params: { page, size, estado: estado || undefined, busqueda: busqueda || undefined },
  });
  return data;
}

// GET /api/admin/disenos/resumen -> { pendiente, publicado, rechazado, oculto, no_publicado }
export async function obtenerResumenDisenos() {
  const { data } = await api.get("/admin/disenos/resumen");
  return data;
}

// GET /api/admin/disenos/top/megusta -> List<DisenoAdminResponse>
export async function topDisenosMeGusta(limite = 10) {
  const { data } = await api.get("/admin/disenos/top/megusta", {
    params: { limite },
  });
  return data;
}

// GET /api/admin/disenos/top/usos -> List<DisenoAdminResponse>
export async function topDisenosUsos(limite = 10) {
  const { data } = await api.get("/admin/disenos/top/usos", {
    params: { limite },
  });
  return data;
}

// PATCH /api/admin/disenos/{id}/aprobar
export async function aprobarDiseno(id) {
  const { data } = await api.patch(`/admin/disenos/${id}/aprobar`);
  return data;
}

// PATCH /api/admin/disenos/{id}/rechazar  (body: { motivo })
export async function rechazarDiseno(id, motivo) {
  const { data } = await api.patch(`/admin/disenos/${id}/rechazar`, { motivo });
  return data;
}

// PATCH /api/admin/disenos/{id}/ocultar  (body: { motivo })
export async function ocultarDiseno(id, motivo) {
  const { data } = await api.patch(`/admin/disenos/${id}/ocultar`, { motivo });
  return data;
}

// DELETE /api/admin/disenos/{id}
export async function eliminarDiseno(id) {
  await api.delete(`/admin/disenos/${id}`);
}
