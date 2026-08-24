import api from "./api";

export async function crearSolicitud({ productoId, descripcion, file }) {
  const formData = new FormData();
  formData.append("productoId", productoId);
  formData.append("descripcion", descripcion);
  if (file) formData.append("file", file);

  const { data } = await api.post("/solicitudes-diseno", formData);
  return data;
}

export async function listarMisSolicitudes() {
  const { data } = await api.get("/solicitudes-diseno/mias");
  return data;
}

export async function obtenerSolicitud(id) {
  const { data } = await api.get(`/solicitudes-diseno/${id}`);
  return data;
}

export async function aprobarSolicitud(id) {
  const { data } = await api.post(`/solicitudes-diseno/${id}/aprobar`);
  return data;
}

export async function solicitarCambios(id, motivo) {
  const { data } = await api.post(`/solicitudes-diseno/${id}/cambios`, {
    motivo,
  });
  return data;
}