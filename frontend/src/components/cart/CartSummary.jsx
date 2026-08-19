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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex items-center justify-between text-gray-500 dark:text-slate-400">
        <span>Productos</span>
        <span>{cantidadProductos}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
        <span>Subtotal</span>
        <span>{formatPrice(total)}</span>
      </div>

      <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
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
