import { useState } from "react";
import {
  FaDollarSign,
  FaClipboardList,
  FaUsers,
  FaBoxOpen,
  FaFileCsv,
  FaFilePdf,
} from "react-icons/fa";

import Button from "../components/Button";
import { getErrorMessage } from "../api/axios";
import { exportarReporteCsv, exportarReportePdf } from "../api/reportesApi";

// Tipos de reporte soportados por el backend (AdminReporteServiceImpl).
const TIPOS = [
  {
    key: "ventas",
    label: "Ventas",
    descripcion: "Pedidos no cancelados con total por venta.",
    icon: FaDollarSign,
    color: "from-emerald-500 to-green-700",
  },
  {
    key: "pedidos",
    label: "Pedidos",
    descripcion: "Todos los pedidos con cantidad de ítems.",
    icon: FaClipboardList,
    color: "from-indigo-500 to-blue-700",
  },
  {
    key: "usuarios",
    label: "Usuarios",
    descripcion: "Usuarios registrados con rol y estado de bloqueo.",
    icon: FaUsers,
    color: "from-violet-500 to-purple-700",
  },
  {
    key: "productos",
    label: "Productos",
    descripcion: "Catálogo de productos con precios y stock.",
    icon: FaBoxOpen,
    color: "from-cyan-500 to-teal-700",
  },
];

function Reportes() {
  // Descarga en curso: { tipo, formato } | null
  const [descargando, setDescargando] = useState(null);
  const [error, setError] = useState(null);

  const exportar = async (tipo, formato) => {
    setError(null);
    setDescargando({ tipo, formato });
    try {
      if (formato === "csv") {
        await exportarReporteCsv(tipo);
      } else {
        await exportarReportePdf(tipo);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDescargando(null);
    }
  };

  const estaDescargando = (tipo, formato) =>
    descargando?.tipo === tipo && descargando?.formato === formato;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reportes
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Exporta reportes de la tienda en CSV (Excel) o PDF.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-2">
        {TIPOS.map(({ key, label, descripcion, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xl text-white ${color}`}
              >
                <Icon />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Reporte de {label}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {descripcion}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="success"
                size="sm"
                loading={estaDescargando(key, "csv")}
                onClick={() => exportar(key, "csv")}
                leftIcon={<FaFileCsv />}
              >
                Exportar CSV
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={estaDescargando(key, "pdf")}
                onClick={() => exportar(key, "pdf")}
                leftIcon={<FaFilePdf />}
              >
                Exportar PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Reportes;
