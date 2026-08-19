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
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl font-bold text-indigo-600 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-600/20 dark:text-cyan-300">
        {item.producto?.charAt(0) ?? "?"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900 dark:text-white">{item.producto}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {formatPrice(item.precioUnitario)} c/u
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-2 py-1 dark:border-slate-700">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDisminuir(item.id)}
          aria-label="Disminuir cantidad"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
        >
          <FaMinus size={10} />
        </button>
        <span className="w-6 text-center text-sm text-gray-900 dark:text-white">{item.cantidad}</span>
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

      <div className="w-24 shrink-0 text-right font-semibold text-gray-900 dark:text-white">
        {formatPrice(item.subtotal)}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onEliminar(item.id)}
        aria-label={`Eliminar ${item.producto} del carrito`}
        className="shrink-0 text-gray-400 transition hover:text-red-500 disabled:opacity-50 dark:text-slate-500 dark:hover:text-red-400"
      >
        <FaTrash />
      </button>
    </div>
  );
}

export default CartItem;
