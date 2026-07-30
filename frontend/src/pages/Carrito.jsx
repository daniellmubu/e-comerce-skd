import { useNavigate } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

import { useCart } from "../context/CartContext";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import Loading from "../components/ui/Loading";

function Carrito() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    error,
    total,
    cantidadProductos,
    aumentarCantidad,
    disminuirCantidad,
    eliminarProducto,
  } = useCart();

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            Carrito
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Tu carrito</h1>
        </div>

        {loading && items.length === 0 && (
          <div className="flex justify-center py-20">
            <Loading label="Cargando tu carrito..." />
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 py-20 text-center text-slate-400">
            <FaShoppingBag className="mb-4 text-4xl text-slate-600" />
            <p>Tu carrito está vacío.</p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white transition hover:scale-105"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
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

            <div>
              <CartSummary
                total={total}
                cantidadProductos={cantidadProductos}
                loading={loading}
                onCheckout={() => navigate("/checkout")}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Carrito;
