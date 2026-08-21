import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaBoxOpen,
  FaClipboardList,
  FaDollarSign,
  FaTrophy,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaReceipt,
  FaChartBar,
  FaShoppingBag,
} from "react-icons/fa";

import Badge from "../components/Badge";
import BarChart from "../components/BarChart";
import Loading from "../components/Loading";
import { getErrorMessage } from "../api/axios";
import {
  obtenerResumen,
  obtenerProductosMasVendidos,
  obtenerVentasPorPeriodo,
  obtenerResumenEstadisticas,
} from "../api/dashboardApi";
import { listarPedidos } from "../api/pedidosApi";
import { formatPrice, formatFecha, capitalizar } from "../utils/formato";

const ESTADO_VARIANT = {
  recibido: "cyan",
  disenando: "violet",
  enviado: "amber",
  entregado: "green",
  cancelado: "red",
};

const TARJETAS_PRINCIPALES = [
  { key: "totalUsuarios", label: "Usuarios", icon: FaUsers, enlace: "/usuarios" },
  { key: "totalProductos", label: "Productos", icon: FaBoxOpen, enlace: "/productos" },
  { key: "totalPedidos", label: "Pedidos", icon: FaShoppingBag, enlace: "/pedidos" },
  { key: "ventasTotales", label: "Ventas totales", icon: FaDollarSign, moneda: true },
];

const TARJETAS_ESTADO = [
  { key: "pedidosPendientes", label: "Pendientes", icon: FaClock, variant: "amber" },
  { key: "pedidosCompletados", label: "Completados", icon: FaCheckCircle, variant: "green" },
  { key: "pedidosCancelados", label: "Cancelados", icon: FaTimesCircle, variant: "red" },
];

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [ventasPeriodo, setVentasPeriodo] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [datosResumen, datosEstadisticas, datosVentas, datosTop, datosPedidos] =
        await Promise.all([
          obtenerResumen(),
          obtenerResumenEstadisticas(),
          obtenerVentasPorPeriodo(),
          obtenerProductosMasVendidos(5),
          listarPedidos({ size: 5, sort: "id,desc" }),
        ]);

      setResumen(datosResumen);
      setEstadisticas(datosEstadisticas);
      setVentasPeriodo(datosVentas);
      setTopProductos(datosTop);
      setPedidosRecientes(datosPedidos?.content ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const datosGrafico = ventasPeriodo.map((v) => ({
    label: v.periodo,
    valor: Number(v.total ?? 0),
  }));

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando dashboard..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Tarjetas principales */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {TARJETAS_PRINCIPALES.map(({ key, label, icon: Icon, moneda, enlace }) => {
              const contenido = (
                <>
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
                </>
              );

              return enlace ? (
                <Link
                  key={key}
                  to={enlace}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-cyan-400/50"
                >
                  {contenido}
                </Link>
              ) : (
                <div
                  key={key}
                  className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  {contenido}
                </div>
              );
            })}
          </div>

          {/* Tarjetas de estado + ticket promedio */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {TARJETAS_ESTADO.map(({ key, label, icon: Icon, variant }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {Number(resumen?.[key] ?? 0).toLocaleString("es-CO")}
                  </p>
                </div>
                <Badge variant={variant}>
                  <Icon />
                </Badge>
              </div>
            ))}

            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Ticket promedio
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(estadisticas?.ticketPromedio)}
                </p>
              </div>
              <Badge variant="violet">
                <FaReceipt />
              </Badge>
            </div>
          </div>

          {/* Gráfico de ventas por periodo */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-6 flex items-center gap-2">
              <FaChartBar className="text-indigo-500 dark:text-cyan-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Ventas por mes
              </h2>
            </div>
            <BarChart datos={datosGrafico} alto={220} />
          </div>

          {/* Pedidos recientes + productos más vendidos */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Pedidos recientes */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FaShoppingBag className="text-indigo-500 dark:text-cyan-400" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Pedidos recientes
                  </h2>
                </div>
                <Link
                  to="/pedidos"
                  className="text-sm text-indigo-600 hover:underline dark:text-cyan-400"
                >
                  Ver todos
                </Link>
              </div>

              {pedidosRecientes.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                  No hay pedidos registrados.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {pedidosRecientes.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between gap-3 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          #{pedido.id} · {pedido.usuario}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatFecha(pedido.creadoEn)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(pedido.total)}
                        </span>
                        <Badge variant={ESTADO_VARIANT[pedido.estado] || "slate"}>
                          {capitalizar(pedido.estado)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Productos más vendidos */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                <FaTrophy className="text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Productos más vendidos
                </h2>
              </div>

              {topProductos.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                  Aún no hay ventas registradas.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {topProductos.map((item, index) => (
                    <div
                      key={item.productoId}
                      className="flex items-center justify-between gap-3 px-6 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                          {index + 1}
                        </span>
                        <p className="truncate font-semibold text-gray-900 dark:text-white">
                          {item.producto}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(item.ingresoTotal)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {item.unidadesVendidas} uds
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
