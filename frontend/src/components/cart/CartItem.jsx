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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {/* Fila superior: imagen + nombre + eliminar */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-600/20 text-xl font-bold text-cyan-300">
          {item.producto?.charAt(0) ?? "?"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{item.producto}</p>
          <p className="text-sm text-slate-400">
            {formatPrice(item.precioUnitario)} c/u
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onEliminar(item.id)}
          aria-label={`Eliminar ${item.producto} del carrito`}
          className="shrink-0 self-start text-slate-500 transition hover:text-red-400 disabled:opacity-50"
        >
          <FaTrash />
        </button>
      </div>

      {/* Fila inferior: selector de cantidad + subtotal */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-700 px-2 py-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDisminuir(item.id)}
            aria-label="Disminuir cantidad"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-50"
          >
            <FaMinus size={10} />
          </button>
          <span className="w-6 text-center text-sm text-white">
            {item.cantidad}
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAumentar(item.id)}
            aria-label="Aumentar cantidad"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-cyan-400 disabled:opacity-50"
          >
            <FaPlus size={10} />
          </button>
        </div>

        <div className="shrink-0 text-right font-semibold text-white">
          {formatPrice(item.subtotal)}
        </div>
      </div>
    </div>
  );
}

export default CartItem;