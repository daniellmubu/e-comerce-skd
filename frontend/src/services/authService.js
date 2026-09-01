import api from "./api";

const TOKEN_KEY = "skd_token";
const REFRESH_TOKEN_KEY = "skd_refresh_token";
const USER_KEY = "skd_user";

function guardarSesion(authResponse) {
  const { token, refreshToken, ...usuario } = authResponse;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

// Lee la fecha de expiración ("exp") que viene codificada dentro del
// propio JWT, sin necesidad de llamar al backend. Un JWT tiene 3 partes
// separadas por puntos (header.payload.signature); la del medio es la
// que trae los datos, codificados en base64.
function decodificarPayload(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    );
    return JSON.parse(payloadJson);
  } catch {
    // Si el token está corrupto o mal formado, lo tratamos como inválido.
    return null;
  }
}

function tokenExpirado(token) {
  const payload = decodificarPayload(token);
  if (!payload?.exp) return true;

  // "exp" en un JWT viene en segundos; Date.now() da milisegundos.
  const expiraEnMs = payload.exp * 1000;
  return Date.now() >= expiraEnMs;
}

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  guardarSesion(data);
  return data;
}

export async function registrarse({ nombre, username, correo, password, codigoReferido }) {
  const { data } = await api.post("/auth/registro", {
    nombre,
    username,
    correo,
    password,
    codigoReferido,
  });
  guardarSesion(data);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function obtenerUsuarioActual() {
  const token = localStorage.getItem(TOKEN_KEY);
  const usuario = localStorage.getItem(USER_KEY);

  if (!token || !usuario) return null;

  // Si el token ya venció, la sesión guardada ya no sirve: la limpiamos
  // para que la próxima carga de la página no muestre a un usuario
  // "fantasma" que en realidad ya no puede hacer ninguna petición.
  if (tokenExpirado(token)) {
    logout();
    return null;
  }

  return JSON.parse(usuario);
}

export function obtenerUsuarioId() {
  const usuario = obtenerUsuarioActual();
  return usuario?.id ?? null;
}

export function estaAutenticado() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  if (tokenExpirado(token)) {
    logout();
    return false;
  }

  return true;
}

export async function solicitarRestablecerPassword(correo) {
  const { data } = await api.post("/auth/olvide-password", { correo });
  return data;
}

export async function restablecerPassword(token, password) {
  const { data } = await api.post("/auth/restablecer-password", {
    token,
    password,
  });
  return data;
}

export async function verificarEmail(token) {
  const { data } = await api.post("/auth/verificar-email", { token });
  return data;
}

export async function reenviarVerificacion(correo) {
  const { data } = await api.post("/auth/reenviar-verificacion", { correo });
  return data;
}

export async function verificarPasswordActual(passwordActual) {
  const { data } = await api.post("/auth/verificar-password", { passwordActual });
  return data;
}

export async function cambiarPassword({ passwordActual, nuevaPassword }) {
  const { data } = await api.post("/auth/cambiar-password", {
    passwordActual,
    nuevaPassword,
  });
  return data;
}