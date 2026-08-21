import api from "./axios";

// GET /api/admin/dashboard/resumen
// Respuesta: { totalUsuarios, totalProductos, totalPedidos, ventasTotales,
//             pedidosPendientes, pedidosCompletados, pedidosCancelados }
export async function obtenerResumen() {
  const { data } = await api.get("/admin/dashboard/resumen");
  return data;
}

// GET /api/admin/dashboard/productos-mas-vendidos?limite=5
// Respuesta: [{ productoId, producto, unidadesVendidas, ingresoTotal }]
export async function obtenerProductosMasVendidos(limite = 5) {
  const { data } = await api.get("/admin/dashboard/productos-mas-vendidos", {
    params: { limite },
  });
  return data;
}

// GET /api/admin/dashboard/ventas-por-periodo
// Respuesta: [{ periodo: "2026-07", total }]
export async function obtenerVentasPorPeriodo() {
  const { data } = await api.get("/admin/dashboard/ventas-por-periodo");
  return data;
}
