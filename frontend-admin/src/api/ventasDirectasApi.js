import api from "./axios";

// CRUD de ventas directas (ventas hechas fuera de la tienda online).
// Respuesta típica: { id, clienteId, nombreCliente, telefono, metodoPago, estado,
//   nota, total, creadoEn, pagadoEn, canceladoEn, items: [{ productoId,
//   productoNombre, varianteId, talla, color, detalle, cantidad, precioUnitario,
//   subtotal }] }
// estado: pendiente (por cobrar) | cobrada | cancelada

// Clientes guardados que coinciden por nombre/teléfono (autocompletado).
export async function listarClientesVentaDirecta(q) {
  const { data } = await api.get("/admin/ventas-directas/clientes", {
    params: { q },
  });
  return data;
}

export async function listarVentasDirectas({
  page = 0,
  size = 10,
  estado,
  q,
} = {}) {
  const { data } = await api.get("/admin/ventas-directas", {
    params: { page, size, estado, q },
  });
  return data;
}

export async function obtenerVentaDirecta(id) {
  const { data } = await api.get(`/admin/ventas-directas/${id}`);
  return data;
}

// Body: { nombreCliente, telefono, metodoPago, estado, nota,
//   items: [{ productoId, varianteId, cantidad, precioUnitario }] }
export async function crearVentaDirecta(venta) {
  const { data } = await api.post("/admin/ventas-directas", venta);
  return data;
}

// Marca la venta como cobrada (true) o por cobrar (false).
export async function cambiarCobroVentaDirecta(id, cobrado) {
  const { data } = await api.patch(`/admin/ventas-directas/${id}/cobro`, {
    cobrado,
  });
  return data;
}

// Cancela la venta y devuelve el stock al inventario.
export async function cancelarVentaDirecta(id) {
  const { data } = await api.post(`/admin/ventas-directas/${id}/cancelar`);
  return data;
}

// Reactiva una venta cancelada volviendo a reservar el stock.
export async function reactivarVentaDirecta(id) {
  const { data } = await api.post(`/admin/ventas-directas/${id}/reactivar`);
  return data;
}
