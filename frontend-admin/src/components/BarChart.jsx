import { formatPrice } from "../utils/formato";

/**
 * Gráfico de barras verticales sencillo (CSS puro, sin dependencias).
 * - datos: [{ label, valor }]
 * - alto: altura del contenedor en px.
 */
function BarChart({ datos = [], alto = 220 }) {
  if (!datos || datos.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">
        Sin datos para mostrar.
      </p>
    );
  }

  const max = Math.max(...datos.map((d) => d.valor ?? 0), 1);

  return (
    <div className="flex items-end gap-2" style={{ height: alto }}>
      {datos.map((d) => (
        <div
          key={d.label}
          className="group flex h-full flex-1 flex-col justify-end"
        >
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-400 transition-all group-hover:opacity-80 dark:from-cyan-500 dark:to-violet-600"
            style={{ height: `${Math.max((d.valor / max) * 100, 3)}%` }}
            title={`${d.label}: ${formatPrice(d.valor)}`}
          />
          <span className="mt-1 truncate text-center text-[10px] text-gray-500 dark:text-slate-400">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default BarChart;
