import api from "./api";

export async function calcularEnvio(direccionId) {
  const { data } = await api.get("/envios/calcular", {
    params: { direccionId },
  });
  return data;
}