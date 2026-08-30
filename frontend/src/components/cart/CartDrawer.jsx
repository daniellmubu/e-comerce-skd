import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import Loading from "../ui/Loading";

function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    loading,
    error,
    total,
    cantidadProductos,
    cerrarCarrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarProducto,
  } = useCart();

  if (!isOpen) return null;

  const handleCheckout = () => {
    cerrarCarrito();
    navigate("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={cerrarCarrito}
        aria-hidden="true"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tu carrito</h2>
          <button
            type="button"
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {loading && items.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-6">
              <Loading label="Cargando tu carrito..." />
            </div>
          )}

          {error && (
            <div className="px-6 pt-4">
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-gray-500 dark:text-slate-400">
              <p>Tu carrito está vacío.</p>
              <button
                type="button"
                onClick={() => {
                  cerrarCarrito();
                  navigate("/catalogo");
                }}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                Ver catálogo
              </button>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    disabled={loading}
                    onAumentar={aumentarCantidad}
                    onDisminuir={disminuirCantidad}
                    onEliminar={eliminarProducto}
                  />
                ))}
              </div>

              <div className="shrink-0 border-t border-gray-100 bg-white px-6 py-6 dark:border-slate-800 dark:bg-slate-950">
                <CartSummary
                  total={total}
                  cantidadProductos={cantidadProductos}
                  loading={loading}
                  onCheckout={handleCheckout}
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
