import api from "./api";

export async function listarDirecciones() {
  const { data } = await api.get("/direcciones");
  return data;
}

export async function obtenerDireccionPorId(id) {
  const { data } = await api.get(`/direcciones/${id}`);
  return data;
}

export async function listarDireccionesPorUsuario(usuarioId) {
  const { data } = await api.get(`/direcciones/usuario/${usuarioId}`);
  return data;
}

export async function crearDireccion(direccion) {
  const { data } = await api.post("/direcciones", direccion);
  return data;
}

export async function eliminarDireccion(id) {
  await api.delete(`/direcciones/${id}`);
}
