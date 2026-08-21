import api from "./axios";

// Tipos de reporte válidos en el backend: ventas, pedidos, usuarios, productos.
// GET /api/admin/reportes/{tipo}/csv   -> CSV UTF-8 (abre en Excel)
// GET /api/admin/reportes/{tipo}/pdf   -> PDF

async function descargar(tipo, formato) {
  const { data } = await api.get(`/admin/reportes/${tipo}/${formato}`, {
    responseType: "blob",
  });

  const url = URL.createObjectURL(data);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `reporte_${tipo}.${formato}`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export function exportarReporteCsv(tipo) {
  return descargar(tipo, "csv");
}

export function exportarReportePdf(tipo) {
  return descargar(tipo, "pdf");
}
