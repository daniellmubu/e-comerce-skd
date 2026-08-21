import { useCallback, useEffect, useState } from "react";
import {
  FaUsers,
  FaBoxOpen,
  FaClipboardList,
  FaDollarSign,
  FaTrophy,
} from "react-icons/fa";

import Loading from "../components/Loading";
import { getErrorMessage } from "../api/axios";
import { obtenerResumen, obtenerProductosMasVendidos } from "../api/dashboardApi";
import { formatPrice } from "../utils/formato";

const TARJETAS = [
  { key: "totalUsuarios", label: "Usuarios", icon: FaUsers },
  { key: "totalProductos", label: "Productos", icon: FaBoxOpen },
  { key: "totalPedidos", label: "Pedidos", icon: FaClipboardList },
  { key: "ventasTotales", label: "Ventas totales", icon: FaDollarSign, moneda: true },
];

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [datosResumen, datosTop] = await Promise.all([
        obtenerResumen(),
        obtenerProductosMasVendidos(5),
      ]);
      setResumen(datosResumen);
      setTop(datosTop);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        Resumen general de la tienda.
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando indicadores..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {TARJETAS.map(({ key, label, icon: Icon, moneda }) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {moneda
                        ? formatPrice(resumen?.[key])
                        : Number(resumen?.[key] ?? 0).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-slate-800">
              <FaTrophy className="text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Productos más vendidos
              </h2>
            </div>

            {top.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                Aún no hay ventas registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Unidades</th>
                      <th className="px-6 py-4 text-right">Ingreso total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {top.map((item, index) => (
                      <tr
                        key={item.productoId}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                          {item.producto}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                          {item.unidadesVendidas}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatPrice(item.ingresoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
