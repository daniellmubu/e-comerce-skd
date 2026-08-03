  import api from "./api";

  export async function obtenerCarritoPorUsuario(usuarioId) {
    const { data } = await api.get(`/carritos/usuario/${usuarioId}`);
    return data;
  }

  export async function crearCarrito(usuarioId) {
    const { data } = await api.post("/carritos", { usuarioId });
    return data;
  }

  export async function obtenerOCrearCarrito(usuarioId) {
    try {
      return await obtenerCarritoPorUsuario(usuarioId);
    } catch (err) {
      if (err.response?.status === 404) {
        return await crearCarrito(usuarioId);
      }
      throw err;
    }
  }

  export async function listarItemsDelCarrito(carritoId) {
  const respuesta = await api.get(`/detalle-carrito/carrito/${carritoId}`);

  console.log("========== RESPUESTA DEL BACKEND ==========");
  console.log(respuesta);
  console.log("respuesta.data =", respuesta.data);
  console.log("¿Es arreglo?", Array.isArray(respuesta.data));

  return respuesta.data;
  }

  export async function agregarItem({ carritoId, productoId, cantidad }) {
    const { data } = await api.post("/detalle-carrito", {
      carritoId,
      productoId,
      cantidad,
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
    });
  }