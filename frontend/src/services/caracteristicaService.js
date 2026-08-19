import api from "./api";

export async function listarCaracteristicasPorProducto(productoId) {
  const { data } = await api.get(`/caracteristicas/producto/${productoId}`);
  return data;
}
