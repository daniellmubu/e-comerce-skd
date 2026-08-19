import { FaShoppingCart } from "react-icons/fa";

import { useCart } from "../../context/CartContext";

function CartIcon() {
  const { cantidadProductos, abrirCarrito } = useCart();

  return (
    <button
      type="button"
      onClick={abrirCarrito}
      aria-label="Abrir carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-400"
    >
      <FaShoppingCart className="text-lg" />
      {cantidadProductos > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500">
          {cantidadProductos > 9 ? "9+" : cantidadProductos}
        </span>
      )}
    </button>
  );
}

export default CartIcon;
