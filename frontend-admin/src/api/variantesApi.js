import api from "./axios";

// GET /api/admin/variantes/producto/{productoId}
// Respuesta: VarianteResponse[] = [{ id, productoId, productoNombre, talla,
//   color, stock, precio, activo }]
export async function listarVariantesDeProducto(productoId) {
  const { data } = await api.get(`/admin/variantes/producto/${productoId}`);
  return data;
}

export async function obtenerVariantePorId(id) {
  const { data } = await api.get(`/admin/variantes/${id}`);
  return data;
}

// Body: { productoId, talla, color, stock, precio, activo }
export async function crearVariante(variante) {
  const { data } = await api.post("/admin/variantes", variante);
  return data;
}

export async function actualizarVariante(id, variante) {
  const { data } = await api.put(`/admin/variantes/${id}`, variante);
  return data;
}

export async function eliminarVariante(id) {
  await api.delete(`/admin/variantes/${id}`);
}
