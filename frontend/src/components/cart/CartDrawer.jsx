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

      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Tu carrito</h2>
          <button
            type="button"
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <FaTimes />
          </button>
        </div>

        {loading && items.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <Loading label="Cargando tu carrito..." />
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <p>Tu carrito está vacío.</p>
            <button
              type="button"
              onClick={() => {
                cerrarCarrito();
                navigate("/catalogo");
              }}
              className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              Ver catálogo
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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

            <div className="mt-6">
              <CartSummary
                total={total}
                cantidadProductos={cantidadProductos}
                loading={loading}
                onCheckout={handleCheckout}
              />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
