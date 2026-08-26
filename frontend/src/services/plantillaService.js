import api from "./api";

/**
 * Galería de plantillas prediseñadas del personalizador.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.categoria] - Ej: "Fechas especiales", "Deportes".
 * @param {string} [filtros.productoTipo] - "camiseta" o "mug"; el backend
 *   incluye siempre las plantillas compatibles con "ambos".
 */
export async function listarPlantillas({ categoria, productoTipo } = {}) {
  const { data } = await api.get("/plantillas", {
    params: {
      categoria: categoria || undefined,
      productoTipo: productoTipo || undefined,
    },
  });
  return data;
}
