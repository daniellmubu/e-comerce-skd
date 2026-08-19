import api from "./api";

export async function listarHistorialPedido(pedidoId) {
  const { data } = await api.get(`/pedidos/${pedidoId}/historial`);
  return data;
}
