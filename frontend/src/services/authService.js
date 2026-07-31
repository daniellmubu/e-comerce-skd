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

export async function login(username, password) {
  const { data } = await api.post("/auth/login", { username, password });
  guardarSesion(data);
  return data;
}

export async function registrarse({ nombre, username, correo, password, rol }) {
  const { data } = await api.post("/auth/registro", {
    nombre,
    username,
    correo,
    password,
    rol,
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
  const usuario = localStorage.getItem(USER_KEY);
  return usuario ? JSON.parse(usuario) : null;
}

export function obtenerUsuarioId() {
  const usuario = obtenerUsuarioActual();
  return usuario?.id ?? null;
}

export function estaAutenticado() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}