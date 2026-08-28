import api from "./api";

export async function obtenerMiCodigo() {
  const { data } = await api.get("/referidos/mi-codigo");
  return data;
}