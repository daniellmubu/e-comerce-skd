import api from "./api";

export async function listarResenasPorProducto(productoId) {
  const { data } = await api.get(`/resenas/producto/${productoId}`);
  return data;
}

export async function crearResena({ productoId, calificacion, comentario, imagenUrl }) {
  const { data } = await api.post("/resenas", {
    productoId,
    calificacion,
    comentario,
    imagenUrl,
  });
  return data;
}

export async function subirImagenResena(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/resenas/imagen", formData);
  return data;
}