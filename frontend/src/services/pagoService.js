import api from "./api";

export async function listarPagos() {
  const { data } = await api.get("/pagos");
  return data;
}

export async function obtenerPagoPorId(id) {
  const { data } = await api.get(`/pagos/${id}`);
  return data;
}

export async function crearPago(pago) {
  const { data } = await api.post("/pagos", pago);
  return data;
}

export async function eliminarPago(id) {
  await api.delete(`/pagos/${id}`);
}
