import api from "./axios";

// GET /api/admin/usuarios (paginado + filtros opcionales)
// Respuesta: Page<UsuarioResponse> = { content, totalElements, totalPages, number, size }
// UsuarioResponse: { id, nombre, username, correo, telefono, verificado, bloqueado, rol }
export async function listarUsuarios({
  page = 0,
  size = 10,
  nombre,
  username,
  correo,
  rol,
  bloqueado,
  verificado,
} = {}) {
  const { data } = await api.get("/admin/usuarios", {
    params: { page, size, nombre, username, correo, rol, bloqueado, verificado },
  });
  return data;
}

export async function obtenerUsuarioPorId(id) {
  const { data } = await api.get(`/admin/usuarios/${id}`);
  return data;
}

// Body: { nombre, username, correo, telefono, contrasena, rol }
// En creación la contraseña y el rol son obligatorios.
export async function crearUsuario(usuario) {
  const { data } = await api.post("/admin/usuarios", usuario);
  return data;
}

// IMPORTANTE: la actualización NO modifica al usuario directamente. El backend
// crea una solicitud pendiente (CambioPendienteResponse) que el cliente debe
// aprobar desde el correo (double opt-in). El rol y la contraseña no se
// cambian desde el panel.
export async function actualizarUsuario(id, usuario) {
  const { data } = await api.put(`/admin/usuarios/${id}`, usuario);
  return data;
}

export async function bloquearUsuario(id) {
  await api.patch(`/admin/usuarios/${id}/bloquear`);
}

export async function desbloquearUsuario(id) {
  await api.patch(`/admin/usuarios/${id}/desbloquear`);
}

// GET /api/admin/usuarios/{id}/cambios
// Respuesta: CambioPendienteResponse[]
export async function listarCambiosPendientes(id) {
  const { data } = await api.get(`/admin/usuarios/${id}/cambios`);
  return data;
}
