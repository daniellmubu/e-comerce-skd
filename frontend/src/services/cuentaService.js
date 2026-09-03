import api from "./api";

export async function solicitarCancelacionCuenta() {
  const { data } = await api.post("/cuenta/solicitar-cancelacion");
  return data;
}

export async function verificarCodigoCancelacion(codigo) {
  const { data } = await api.post("/cuenta/verificar-codigo-cancelacion", { codigo });
  return data;
}

export async function eliminarCuenta() {
  const { data } = await api.delete("/cuenta");
  return data;
}
