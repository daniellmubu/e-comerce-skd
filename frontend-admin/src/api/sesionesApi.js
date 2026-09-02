import api from "./axios";

// GET /api/admin/sesiones -> [{ id, dispositivo, navegador, ip, creadoEn, expiraEn, esActual }]
export async function listarSesiones() {
  const { data } = await api.get("/admin/sesiones");
  return data;
}

// DELETE /api/admin/sesiones/{id} -> cierra una sesión concreta de esta cuenta.
export async function cerrarSesion(id) {
  const { data } = await api.delete(`/admin/sesiones/${id}`);
  return data;
}

// DELETE /api/admin/sesiones/otras -> cierra todas las sesiones salvo la actual.
export async function cerrarOtrasSesiones() {
  const { data } = await api.delete("/admin/sesiones/otras");
  return data;
}

// DELETE /api/admin/sesiones/actual -> cierra la sesión actual (logout).
export async function cerrarSesionActual() {
  await api.delete("/admin/sesiones/actual");
}
