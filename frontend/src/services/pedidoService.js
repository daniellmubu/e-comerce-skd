import api from "./api";

export async function listarPedidos() {
  const { data } = await api.get("/pedidos");
  return data;
}

export async function obtenerPedidoPorId(id) {
  const { data } = await api.get(`/pedidos/${id}`);
  return data;
}

export async function listarPedidosPorUsuario(usuarioId) {
  const { data } = await api.get(`/pedidos/usuario/${usuarioId}`);
  return data;
}

export async function crearPedido(pedido) {
  const { data } = await api.post("/pedidos", pedido);
  return data;
}

export async function eliminarPedido(id) {
  await api.delete(`/pedidos/${id}`);
}
