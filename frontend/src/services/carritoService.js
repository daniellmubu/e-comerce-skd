  import api from "./api";

  export async function obtenerCarritoPorUsuario() {
    const { data } = await api.get("/carritos/usuario");
    return data;
  }

  export async function crearCarrito() {
    const { data } = await api.post("/carritos");
    return data;
  }

  export async function obtenerOCrearCarrito() {
    try {
      return await obtenerCarritoPorUsuario();
    } catch (err) {
      if (err.response?.status === 404) {
        return await crearCarrito();
      }
      throw err;
    }
  }

  export async function listarItemsDelCarrito(carritoId) {
  const respuesta = await api.get(`/detalle-carrito/carrito/${carritoId}`);


  return respuesta.data;
  }

  export async function agregarItem({ carritoId, productoId, cantidad, varianteId = null, disenoId = null }) {
    const { data } = await api.post("/detalle-carrito", {
      carritoId,
      productoId,
      cantidad,
      varianteId,
      disenoId,
    });
    return data;
  }

  export async function eliminarItem(itemId) {
    await api.delete(`/detalle-carrito/${itemId}`);
  }

  /**
   * El backend no expone un endpoint para actualizar la cantidad de un item
   * existente (solo GET/POST/DELETE en /api/detalle-carrito). Mientras no
   * exista un PUT/PATCH real, simulamos la actualización borrando la fila
   * vieja y creando una nueva con la cantidad correcta.
   */
  export async function actualizarCantidadItem(item, nuevaCantidad) {
    await eliminarItem(item.id);
    return agregarItem({
      carritoId: item.carritoId,
      productoId: item.productoId,
      cantidad: nuevaCantidad,
      varianteId: item.varianteId ?? null,
    });
  }