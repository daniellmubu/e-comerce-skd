import api from "./axios";

// GET /api/admin/tarifas-envio (paginado + filtro opcional por departamento)
// Respuesta: Page<TarifaEnvioResponse> = { content, totalElements, totalPages, number, size }
// TarifaEnvioResponse: { id, departamento, costoBase, diasEstimados }
export async function listarTarifasEnvio({ page = 0, size = 10, departamento } = {}) {
  const { data } = await api.get("/admin/tarifas-envio", {
    params: { page, size, departamento },
  });
  return data;
}

export async function obtenerTarifaEnvioPorId(id) {
  const { data } = await api.get(`/admin/tarifas-envio/${id}`);
  return data;
}

// Body: { departamento, costoBase, diasEstimados }
// El backend exige departamento obligatorio y único (sin distinguir mayúsculas).
export async function crearTarifaEnvio(tarifa) {
  const { data } = await api.post("/admin/tarifas-envio", tarifa);
  return data;
}

export async function actualizarTarifaEnvio(id, tarifa) {
  const { data } = await api.put(`/admin/tarifas-envio/${id}`, tarifa);
  return data;
}

export async function eliminarTarifaEnvio(id) {
  await api.delete(`/admin/tarifas-envio/${id}`);
}
