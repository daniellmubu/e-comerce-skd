import api from "./api";

export async function generarDiseno({ prompt, productoId }) {
  const { data } = await api.post("/disenos/generar", { prompt, productoId });
  return data;
}

export async function listarDisenosPorUsuario() {
  const { data } = await api.get("/disenos/usuario");
  return data;
}