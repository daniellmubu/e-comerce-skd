import api from "./api";

export async function listarSolicitudes(estado) {
  const { data } = await api.get("/admin/solicitudes-diseno", {
    params: estado ? { estado } : {},
  });
  return data;
}

export async function obtenerSolicitud(id) {
  const { data } = await api.get(`/admin/solicitudes-diseno/${id}`);
  return data;
}

export async function tomarSolicitud(id) {
  const { data } = await api.patch(`/admin/solicitudes-diseno/${id}/estado`, {
    estado: "EN_DISENO",
  });
  return data;
}

export async function enviarPropuesta(id, { file, mensajeAdmin }) {
  const formData = new FormData();
  formData.append("file", file);
  if (mensajeAdmin) formData.append("mensajeAdmin", mensajeAdmin);

  const { data } = await api.post(
    `/admin/solicitudes-diseno/${id}/propuesta`,
    formData
  );
  return data;
}