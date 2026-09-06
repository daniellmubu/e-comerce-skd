import api from "./api";

export async function listarMisSesiones() {
  const { data } = await api.get("/cuenta/sesiones");
  return data;
}

export async function cerrarSesionDe(id) {
  const { data } = await api.delete(`/cuenta/sesiones/${id}`);
  return data;
}

export async function cerrarOtrasSesiones() {
  const { data } = await api.delete("/cuenta/sesiones/otras");
  return data;
}

export async function cerrarSesionActual() {
  const { data } = await api.delete("/cuenta/sesiones/actual");
  return data;
}
