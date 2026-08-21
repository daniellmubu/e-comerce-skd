import api from "./axios";

// GET /api/admin/empaques (paginado + filtro opcional por tipo)
// Respuesta: Page<EmpaqueResponse> = { content, totalElements, totalPages, number, size }
// EmpaqueResponse: { id, tipo, descripcion, costoAdicional }
export async function listarEmpaques({ page = 0, size = 10, tipo } = {}) {
  const { data } = await api.get("/admin/empaques", {
    params: { page, size, tipo },
  });
  return data;
}

export async function obtenerEmpaquePorId(id) {
  const { data } = await api.get(`/admin/empaques/${id}`);
  return data;
}

// Body: { tipo, descripcion, costoAdicional }
// El backend exige tipo obligatorio y único; costoAdicional nulo = 0.
export async function crearEmpaque(empaque) {
  const { data } = await api.post("/admin/empaques", empaque);
  return data;
}

export async function actualizarEmpaque(id, empaque) {
  const { data } = await api.put(`/admin/empaques/${id}`, empaque);
  return data;
}

// El backend rechaza eliminar si el empaque tiene pedidos asociados.
export async function eliminarEmpaque(id) {
  await api.delete(`/admin/empaques/${id}`);
}
