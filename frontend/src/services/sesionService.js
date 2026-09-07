import api from "./api";

export async function listarSesiones() {
  const { data } = await api.get("/usuario/sesiones");
  return data;
}

export async function cerrarSesionRemota(sesionId) {
  const { data } = await api.delete(`/usuario/sesiones/${sesionId}`);
  return data;
}

export async function cerrarOtrasSesiones() {
  const { data } = await api.delete("/usuario/sesiones/otras");
  return data;
}

export async function cerrarSesionActual() {
  const { data } = await api.delete("/usuario/sesiones/actual");
  return data;
}
