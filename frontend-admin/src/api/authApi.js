import api from "./axios";

/**
 * Login real contra el backend.
 *
 * POST /api/auth/login
 * Body: { username, password }
 *
 * Respuesta (AuthResponse):
 * {
 *   token, refreshToken, id, nombre, username, correo, rol, cuponBienvenida
 * }
 * El rol llega en minúsculas: "admin" | "disenador" | "cliente".
 */
export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  return data;
}
