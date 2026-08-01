import { FaShoppingCart } from "react-icons/fa";

import { useCart } from "../../context/CartContext";

function CartIcon() {
  const { cantidadProductos, abrirCarrito } = useCart();

  return (
    <button
      type="button"
      onClick={abrirCarrito}
      aria-label="Abrir carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-cyan-400"
    >
      <FaShoppingCart className="text-lg" />
      {cantidadProductos > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-[11px] font-bold text-white">
          {cantidadProductos > 9 ? "9+" : cantidadProductos}
        </span>
      )}
    </button>
  );
}

export default CartIcon;
