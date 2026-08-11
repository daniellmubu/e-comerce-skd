import api from "./api";

export async function listarProductos() {
  const { data } = await api.get("/productos");
  return data;
}

export async function obtenerProductoPorId(id) {
  const { data } = await api.get(`/productos/${id}`);
  return data;
}

export async function buscarProductosPorNombre(nombre) {
  const { data } = await api.get("/productos/buscar", { params: { nombre } });
  return data;
}

export async function buscarProductosPorCategoria(categoriaId) {
  const { data } = await api.get(`/productos/categoria/${categoriaId}`);
  return data;
}

export async function crearProducto(producto) {
  const { data } = await api.post("/productos", producto);
  return data;
}

export async function actualizarProducto(id, producto) {
  const { data } = await api.put(`/productos/${id}`, producto);
  return data;
}

export async function eliminarProducto(id) {
  await api.delete(`/productos/${id}`);
}