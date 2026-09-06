import api from "./api";

export async function listarBorradoresNube() {
  const { data } = await api.get("/borradores");
  return data;
}

export async function guardarBorradorNube(nombre, snapshot) {
  const { data } = await api.post("/borradores", { nombre, snapshot });
  return data;
}

export async function obtenerBorradorNube(id) {
  const { data } = await api.get(`/borradores/${id}`);
  return data;
}

export async function eliminarBorradorNube(id) {
  const { data } = await api.delete(`/borradores/${id}`);
  return data;
}
