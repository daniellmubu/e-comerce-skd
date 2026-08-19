import api from "./api";

export async function listarResenasPorProducto(productoId) {
  const { data } = await api.get(`/resenas/producto/${productoId}`);
  return data;
}

export async function crearResena({ productoId, usuarioId, calificacion, comentario }) {
  const { data } = await api.post("/resenas", {
    productoId,
    usuarioId,
    calificacion,
    comentario,
  });
  return data;
}
