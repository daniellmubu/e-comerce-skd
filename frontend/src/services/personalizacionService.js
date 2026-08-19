import api from "./api";

export async function obtenerPersonalizacion(itemCarritoId) {
  const { data } = await api.get(`/personalizaciones/item-carrito/${itemCarritoId}`);
  return data;
}

export async function guardarPersonalizacion({
  itemCarritoId,
  imagenUrl,
  texto,
  rotacion,
  escala,
  costoAdicional,
}) {
  const { data } = await api.post("/personalizaciones", {
    itemCarritoId,
    imagenUrl,
    texto,
    rotacion,
    escala,
    costoAdicional,
  });
  return data;
}
