import api from "./axios";

// GET /api/admin/cupones (paginado + filtros opcionales)
// Respuesta: Page<CuponResponse> = { content, totalElements, totalPages, number, size }
// CuponResponse: { id, codigo, descuentoPorcentaje, fechaInicio, fechaFin,
//   usosMaximos, usosActuales, activo, esUnicoPorUsuario }
export async function listarCupones({
  page = 0,
  size = 10,
  codigo,
  activo,
  fechaInicio,
  fechaFin,
} = {}) {
  const { data } = await api.get("/admin/cupones", {
    params: { page, size, codigo, activo, fechaInicio, fechaFin },
  });
  return data;
}

export async function obtenerCuponPorId(id) {
  const { data } = await api.get(`/admin/cupones/${id}`);
  return data;
}

// Body: { codigo, descuentoPorcentaje, fechaInicio, fechaFin, usosMaximos, activo, esUnicoPorUsuario }
export async function crearCupon(cupon) {
  const { data } = await api.post("/admin/cupones", cupon);
  return data;
}

export async function actualizarCupon(id, cupon) {
  const { data } = await api.put(`/admin/cupones/${id}`, cupon);
  return data;
}

// Asigna el cupón a un usuario concreto (usuarioId) o a todos los clientes (asignarATodos).
// El backend exige exactamente uno de los dos.
// Respuesta: { cuponId, asignados, yaAsignados }
export async function asignarCupon(id, { usuarioId, asignarATodos }) {
  const { data } = await api.post(`/admin/cupones/${id}/asignar`, {
    usuarioId,
    asignarATodos,
  });
  return data;
}

export async function eliminarCupon(id) {
  await api.delete(`/admin/cupones/${id}`);
}
