import api from "./api";

export async function listarCupones() {
  const { data } = await api.get("/cupones");
  return data;
}

export async function listarMisCupones() {
  const { data } = await api.get("/cupones/mios");
  return data;
}

export async function validarCupon(codigo, subtotal) {
  const { data } = await api.get("/cupones/validar", { params: { codigo, subtotal } });
  return data;
}
