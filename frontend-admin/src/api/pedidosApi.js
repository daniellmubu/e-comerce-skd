import api from "./axios";

// GET /api/admin/pedidos (paginado, con filtros opcionales)
// Respuesta: Page<PedidoResponse> = { content, totalElements, totalPages, number, size }
// PedidoResponse: { id, usuarioId, usuario, creadoEn, estado, subtotal, costoEnvio,
//   descuento, total, items: [{ id, productoId, producto, cantidad, precioUnitario,
//   subtotal, disenoId, imagenDisenoUrl }] }
export async function listarPedidos({
  page = 0,
  size = 10,
  sort = "id,desc",
  estado,
  usuarioId,
} = {}) {
  const { data } = await api.get("/admin/pedidos", {
    params: { page, size, sort, estado, usuarioId },
  });
  return data;
}

// GET /api/admin/pedidos/{id}
export async function obtenerPedidoPorId(id) {
  const { data } = await api.get(`/admin/pedidos/${id}`);
  return data;
}

// PATCH /api/admin/pedidos/{id}/estado
// Estados válidos: recibido, disenando, enviado, entregado, cancelado
export async function cambiarEstadoPedido(id, estado) {
  const { data } = await api.patch(`/admin/pedidos/${id}/estado`, { estado });
  return data;
}
