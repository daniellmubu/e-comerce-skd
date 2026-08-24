import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarWeek,
  FaChartBar,
  FaClock,
  FaTrophy,
  FaShoppingBag,
  FaBoxOpen,
  FaClipboardList,
} from "react-icons/fa";

import Badge from "../components/Badge";
import BarChart from "../components/BarChart";
import Loading from "../components/Loading";
import { getErrorMessage } from "../api/axios";
import {
  obtenerVentas,
  obtenerResumen,
  obtenerProductosMasVendidos,
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

const PERIODOS = [
  { id: "anual", label: "Anual", icon: FaCalendarAlt },
  { id: "mensual", label: "Mensual", icon: FaCalendarDay },
  { id: "semanal", label: "Semanal", icon: FaCalendarWeek },
];

const TITULOS_GRAFICO = {
  anual: "Ventas anuales",
  mensual: "Ventas mensuales",
  semanal: "Ventas semanales",
};

const TARJETAS_VENTAS = [
  {
    key: "ventasAnioActual",
    label: "Ventas anuales",
    icon: FaCalendarAlt,
    color: "from-indigo-600 to-violet-600",
  },
  {
    key: "ventasMesActual",
    label: "Ventas mensuales",
    icon: FaCalendarDay,
    color: "from-cyan-500 to-blue-600",
  },
  {
    key: "ventasSemanaActual",
    label: "Ventas semanales",
    icon: FaCalendarWeek,
    color: "from-amber-500 to-orange-600",
  },
];

function formatearEtiqueta(periodo, tipo) {
  if (!periodo) return "";
  if (tipo === "anual") return String(periodo);
  if (tipo === "semanal") {
    const semana = String(periodo).split("-").pop();
    return `S${semana}`;
  }
  const [anio, mes] = String(periodo).split("-");
  const nombreMes = new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString("es-CO", {
    month: "short",
  });
  return `${nombreMes} ${String(anio).slice(2)}`;
}

function Dashboard() {
  const [ventas, setVentas] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [topProducto, setTopProducto] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [periodoActivo, setPeriodoActivo] = useState("anual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [datosVentas, datosResumen, datosTop, datosPedidos] = await Promise.all([
        obtenerVentas(),
        obtenerResumen(),
        obtenerProductosMasVendidos(1),
        listarPedidos({ size: 50, sort: "id,desc" }),
      ]);

      setVentas(datosVentas);
      setResumen(datosResumen);
      setTopProducto(datosTop?.[0] ?? null);

      const pendientesFiltrados = (datosPedidos?.content ?? []).filter(
        (p) => p.estado === "recibido" || p.estado === "disenando"
      );
      setPendientes(pendientesFiltrados.slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const serieActiva = ventas?.[periodoActivo] ?? [];
  const datosGrafico = serieActiva.map((v) => ({
    label: formatearEtiqueta(v.periodo, periodoActivo),
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
          {/* Ventas anuales, mensuales y semanales (balance del periodo actual) */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {TARJETAS_VENTAS.map(({ key, label, icon: Icon, color }) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-xl text-white`}
                  >
                    <Icon />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(ventas?.[key])}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de ventas con balance anual / mensual / semanal */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaChartBar className="text-indigo-500 dark:text-cyan-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {TITULOS_GRAFICO[periodoActivo]}
                </h2>
              </div>
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
                {PERIODOS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPeriodoActivo(id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      periodoActivo === id
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-cyan-400"
                        : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    <Icon />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <BarChart datos={datosGrafico} alto={240} />
          </div>

          {/* Pedidos pendientes + producto más vendido */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Pedidos pendientes */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FaClock className="text-amber-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    Pedidos pendientes
                  </h2>
                </div>
                <Badge variant="amber">
                  {Number(resumen?.pedidosPendientes ?? 0).toLocaleString("es-CO")}
                </Badge>
              </div>

              {pendientes.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500 dark:text-slate-400">
                  No hay pedidos pendientes.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {pendientes.map((pedido) => (
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

              <div className="border-t border-gray-100 px-6 py-3 dark:border-slate-800">
                <Link
                  to="/pedidos"
                  className="text-sm text-indigo-600 hover:underline dark:text-cyan-400"
                >
                  Ver todos los pedidos
                </Link>
              </div>
            </div>

            {/* Producto más vendido */}
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4 dark:border-slate-800">
                <FaTrophy className="text-amber-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Producto más vendido
                </h2>
              </div>

              {!topProducto ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <FaBoxOpen className="text-4xl text-gray-300 dark:text-slate-600" />
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    Aún no hay ventas registradas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl text-white shadow-lg shadow-amber-500/20">
                    <FaTrophy />
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-500">
                      <FaShoppingBag />
                      #1 más vendido
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {topProducto.producto}
                    </h3>
                  </div>
                  <div className="flex w-full max-w-sm items-center justify-center gap-6 rounded-2xl border border-gray-100 bg-gray-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-slate-400">Unidades</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {Number(topProducto.unidadesVendidas ?? 0).toLocaleString("es-CO")}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-slate-700" />
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-slate-400">Ingresos</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(topProducto.ingresoTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                    <FaClipboardList />
                    Más vendido según unidades vendidas
                  </div>
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
