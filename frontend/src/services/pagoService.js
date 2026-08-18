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

export async function simularPagoTarjeta(pagoId, datosTarjeta) {
  const { data } = await api.post(`/pagos/${pagoId}/simular-tarjeta`, datosTarjeta);
  return data;
}

export async function iniciarPagoWompi(pagoId) {
  const { data } = await api.post(`/pagos/${pagoId}/wompi`);
  return data;
}

export async function consultarEstadoPago(pagoId) {
  const { data } = await api.get(`/pagos/${pagoId}/estado`);
  return data;
}
