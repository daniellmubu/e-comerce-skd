// Helpers de formato compartidos por el panel admin.

export function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export function formatFecha(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatFechaHora(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function capitalizar(value) {
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}
