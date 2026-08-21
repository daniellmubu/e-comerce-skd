import api from "./api";

export async function generarDiseno({ prompt, productoId, estilo, imagenReferencia }) {
  const { data } = await api.post("/disenos/generar", {
    prompt,
    productoId,
    estilo,
    imagenReferencia,
  });
  return data;
}

export async function listarDisenosPorUsuario() {
  const { data } = await api.get("/disenos/usuario");
  return data;
}