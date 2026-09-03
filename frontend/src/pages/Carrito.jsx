import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

import { toast } from "sonner";
import { getErrorMessage } from "../services/api";
import { useCart } from "../context/CartContext";
import { validarCupon } from "../services/cuponService";
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
    vaciarCarrito,
  } = useCart();

  const handleAumentar = async (id) => {
    try { await aumentarCantidad(id); } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const handleDisminuir = async (id) => {
    try { await disminuirCantidad(id); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const [codigoCupon, setCodigoCupon] = useState("");
  const [cuponInfo, setCuponInfo] = useState(null);
  const [errorCupon, setErrorCupon] = useState(null);

  const handleValidarCupon = async () => {
    if (!codigoCupon.trim()) { setErrorCupon("Escribe un código"); return; }
    try {
      const cupon = await validarCupon(codigoCupon.trim().toUpperCase(), total);
      setCuponInfo(cupon);
      setErrorCupon(null);
      toast.success(`Cupón ${cupon.codigo} válido: -${cupon.descuentoPorcentaje}%`);
    } catch (e) {
      setCuponInfo(null);
      const msg = getErrorMessage(e);
      setErrorCupon(msg);
      toast.error(msg);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
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
          <p className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaShoppingBag className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>Tu carrito está vacío.</p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={async () => { try { await vaciarCarrito(); toast.success("Carrito vaciado"); } catch(e){ toast.error(getErrorMessage(e)); } }}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Vaciar carrito
              </button>
            </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  disabled={loading}
                  onAumentar={handleAumentar}
                  onDisminuir={handleDisminuir}
                  onEliminar={eliminarProducto}
                />
              ))}
            </div>

            <div className="space-y-4">
              {/* Cupón en carrito TC-CART-13 a 16 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <p className="mb-2 text-sm font-semibold">¿Tienes un cupón?</p>
                <div className="flex gap-2">
                  <input value={codigoCupon} onChange={(e)=>setCodigoCupon(e.target.value.toUpperCase())} placeholder="Ej: SKD20" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <button onClick={handleValidarCupon} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white dark:bg-cyan-600">Validar</button>
                </div>
                {errorCupon && <p className="mt-2 text-xs text-red-500">{errorCupon}</p>}
                {cuponInfo && <p className="mt-2 text-xs text-emerald-600">Cupón {cuponInfo.codigo} válido: -{Number(cuponInfo.descuentoPorcentaje)}% {cuponInfo.montoMinimo ? `(mín $${cuponInfo.montoMinimo})` : ""}</p>}
              </div>
              <CartSummary
                total={total}
                cantidadProductos={cantidadProductos}
                loading={loading}
                onCheckout={() => navigate("/checkout")}
              />
            </div>
          </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Carrito;
