import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DEFAULT_PAGE_SIZES = [10, 25, 50];

function calcularRango(totalPages, page) {
  const inicio = Math.max(0, Math.min(page - 2, totalPages - 5));
  const fin = Math.min(totalPages, inicio + 5);
  const paginas = [];
  for (let i = inicio; i < fin; i++) paginas.push(i);
  return paginas;
}

/**
 * Paginación compatible con la estructura `Page` de Spring Data:
 * - page: número actual (0-based, = data.number)
 * - totalPages: data.totalPages
 * - totalElements: data.totalElements
 * - pageSize: data.size
 */
function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sizeOptions = DEFAULT_PAGE_SIZES,
}) {
  if (!totalPages || totalPages <= 1) {
    if (!totalElements) return null;
    return (
      <div className="flex items-center justify-between gap-4 px-1 py-2 text-sm text-gray-500 dark:text-slate-400">
        <span>
          Mostrando {totalElements}{" "}
          {totalElements === 1 ? "registro" : "registros"}
        </span>
      </div>
    );
  }

  const paginaActual = Math.min(Math.max(page ?? 0, 0), totalPages - 1);
  const paginas = calcularRango(totalPages, paginaActual);
  const primero = totalElements ? paginaActual * (pageSize || 1) + 1 : null;
  const ultimo = totalElements
    ? Math.min((paginaActual + 1) * (pageSize || 1), totalElements)
    : null;

  const botonBase =
    "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  const botonNormal =
    "border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300";

  const botonActivo =
    "border border-indigo-600 bg-indigo-600 text-white dark:border-cyan-400 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600";

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      {totalElements != null && (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Mostrando{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {primero}–{ultimo}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {totalElements}
          </span>{" "}
          registros
        </p>
      )}

      <div className="flex items-center gap-1.5">
        {onPageSizeChange && (
          <select
            value={pageSize || sizeOptions[0]}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="mr-2 h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-600 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-cyan-400"
            aria-label="Tamaño de página"
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / pág
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => onPageChange?.(paginaActual - 1)}
          disabled={paginaActual === 0}
          className={`${botonBase} ${botonNormal}`}
          aria-label="Página anterior"
        >
          <FaChevronLeft className="text-xs" />
        </button>

        {paginas.map((pagina) => (
          <button
            key={pagina}
            type="button"
            onClick={() => onPageChange?.(pagina)}
            className={`${botonBase} ${
              pagina === paginaActual ? botonActivo : botonNormal
            }`}
            aria-current={pagina === paginaActual ? "page" : undefined}
          >
            {pagina + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange?.(paginaActual + 1)}
          disabled={paginaActual >= totalPages - 1}
          className={`${botonBase} ${botonNormal}`}
          aria-label="Página siguiente"
        >
          <FaChevronRight className="text-xs" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
