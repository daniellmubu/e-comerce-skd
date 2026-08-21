import api from "./axios";

// ---- Dashboard (GET /api/admin/dashboard) ----

// Resumen general: { totalUsuarios, totalProductos, totalPedidos, ventasTotales,
//   pedidosPendientes, pedidosCompletados, pedidosCancelados }
export async function obtenerResumen() {
  const { data } = await api.get("/admin/dashboard/resumen");
  return data;
}

// Top productos: [{ productoId, producto, unidadesVendidas, ingresoTotal }]
export async function obtenerProductosMasVendidos(limite = 5) {
  const { data } = await api.get("/admin/dashboard/productos-mas-vendidos", {
    params: { limite },
  });
  return data;
}

// Ventas por mes: [{ periodo: "2026-07", total }]
export async function obtenerVentasPorPeriodo() {
  const { data } = await api.get("/admin/dashboard/ventas-por-periodo");
  return data;
}

// ---- Estadísticas (GET /api/admin/estadisticas, solo pagos aprobados) ----

// Resumen de estadísticas: { ingresosTotales, totalPedidos, ticketPromedio }
export async function obtenerResumenEstadisticas() {
  const { data } = await api.get("/admin/estadisticas/resumen");
  return data;
}

// Ventas por día: [{ fecha: "yyyy-MM-dd", total }]. Sin fechas devuelve los últimos 30 días.
export async function obtenerVentasPorDia(desde, hasta) {
  const { data } = await api.get("/admin/estadisticas/ventas", {
    params: { desde, hasta },
  });
  return data;
}

// Top productos (pagos aprobados): [{ productoId, producto, unidadesVendidas, ingresoTotal }]
export async function obtenerTopEstadisticas(limite = 10) {
  const { data } = await api.get("/admin/estadisticas/productos-mas-vendidos", {
    params: { limite },
  });
  return data;
}
