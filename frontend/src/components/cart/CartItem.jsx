import { FaMinus, FaPlus, FaTrash } from "react-icons/fa";

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function CartItem({ item, onAumentar, onDisminuir, onEliminar, disabled }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60 sm:gap-4 sm:p-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center self-start rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-600/20 dark:text-cyan-300 sm:h-16 sm:w-16 sm:text-2xl">
        {item.producto?.charAt(0) ?? "?"}
      </div>

      <div className="min-w-0 flex-1">
        {/* Fila superior: nombre + eliminar */}
        <div className="flex items-start justify-between gap-2">
          <p
            title={item.producto}
            className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight text-gray-900 line-clamp-2 dark:text-white sm:text-[15px]"
          >
            {item.producto}
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onEliminar(item.id)}
            aria-label={`Eliminar ${item.producto} del carrito`}
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <FaTrash size={12} />
          </button>
        </div>

        {item.talla || item.color ? (
          <p className="mt-0.5 break-words text-xs leading-tight text-gray-500 dark:text-slate-400">
            {[item.talla && `Talla ${item.talla}`, item.color && `Color ${item.color}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 sm:text-sm">
          {formatPrice(item.precioUnitario)} c/u
        </p>

        {/* Fila inferior: controles + subtotal */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 px-1.5 py-1 dark:border-slate-700">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onDisminuir(item.id)}
              aria-label="Disminuir cantidad"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
            >
              <FaMinus size={10} />
            </button>
            <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">
              {item.cantidad}
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAumentar(item.id)}
              aria-label="Aumentar cantidad"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
            >
              <FaPlus size={10} />
            </button>
          </div>

          <span className="shrink-0 text-right text-sm font-bold text-gray-900 dark:text-white sm:text-base">
            {formatPrice(item.subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
