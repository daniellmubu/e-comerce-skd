import Button from "../ui/Button";

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function CartSummary({ total, cantidadProductos, onCheckout, loading, checkoutLabel = "Ir a pagar" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex items-center justify-between text-slate-400">
        <span>Productos</span>
        <span>{cantidadProductos}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-lg font-bold text-white">
        <span>Subtotal</span>
        <span>{formatPrice(total)}</span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        El envío y los descuentos se calculan en el checkout.
      </p>

      <Button
        type="button"
        fullWidth
        className="mt-6"
        loading={loading}
        disabled={cantidadProductos === 0}
        onClick={onCheckout}
      >
        {checkoutLabel}
      </Button>
    </div>
  );
}

export default CartSummary;
