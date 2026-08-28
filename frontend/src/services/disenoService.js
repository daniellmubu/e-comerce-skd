import api from "./api";

export async function generarDiseno({ prompt, productoId, estilo, imagenReferencia }) {
  const { data } = await api.post("/disenos/generar", {
    prompt,
    productoId,
    estilo,
    imagenReferencia,
  });
  return data;
}

export async function listarDisenosPorUsuario() {
  const { data } = await api.get("/disenos/usuario");
  return data;
}

/**
 * Sube el PNG final compuesto en el editor manual (Konva) al backend.
 * El backend valida que sea imagen, la guarda en Supabase Storage y crea un
 * registro Diseno con origen=USUARIO. El token JWT lo inyecta el interceptor
 * de `api` automáticamente (Authorization: Bearer <token>).
 */
export async function subirDiseno({ file, productoId }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("productoId", productoId);
  formData.append("origen", "USUARIO");

  const { data } = await api.post("/disenos/subir", formData);
  return data;
}

/**
 * Agrega un diseño ya creado al carrito (POST /api/detalle-carrito).
 * El backend verifica que el diseño pertenezca al usuario autenticado.
 */
export async function agregarDisenoAlCarrito({
  carritoId,
  productoId,
  disenoId,
  cantidad = 1,
}) {
  const { data } = await api.post("/detalle-carrito", {
    carritoId,
    productoId,
    cantidad,
    disenoId,
  });
  return data;
}

export async function eliminarDiseno(id) {
  await api.delete(`/disenos/${id}`);
}

export async function eliminarTodosDisenos() {
  const { data } = await api.delete("/disenos");
  return data;
}