import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaShoppingCart, FaSpinner, FaMugHot } from "react-icons/fa";

import { obtenerVariantesDeProducto } from "../../services/productService";
import { estaAutenticado } from "../../services/authService";
import { getErrorMessage } from "../../services/api";
import { useCart } from "../../context/CartContext";

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

// Solo las prendas con talla (camisas y sudaderas) admiten variantes.
const esPrendaConTalla = (categoria) => {
  const nombre = (categoria || "").toLowerCase();
  return nombre.includes("camis") || nombre.includes("sudadera");
};

/**
 * Tarjeta de producto del catálogo público.
 * Si el producto tiene variantes (talla/color) muestra un selector y agrega al
 * carrito la variante elegida; en caso contrario agrega el producto directo.
 */
function ProductCard({
  producto,
  imagenFallback,
  gradiente = "from-slate-500 to-slate-700",
  esFavorito = false,
  onToggleFavorito,
}) {
  const navigate = useNavigate();
  const { agregarProducto } = useCart();

  const esPrenda = esPrendaConTalla(producto?.categoria);

  const [variantes, setVariantes] = useState([]);
  // Arranca en "cargando" solo si el producto puede tener talla/color.
  const [cargandoVariantes, setCargandoVariantes] = useState(() => esPrenda);
  const [tallaSel, setTallaSel] = useState(null);
  const [colorSel, setColorSel] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Carga las variantes una sola vez para los productos que pueden tener talla.
  useEffect(() => {
    if (!producto?.id || !esPrenda) return;
    let activo = true;
    obtenerVariantesDeProducto(producto.id)
      .then((data) => {
        if (!activo) return;
        const lista = Array.isArray(data) ? data : [];
        setVariantes(lista);
        const tallas = [...new Set(lista.map((v) => v.talla))];
        const colores = [...new Set(lista.map((v) => v.color))];
        if (tallas.length === 1) setTallaSel(tallas[0]);
        if (colores.length === 1) setColorSel(colores[0]);
      })
      .catch(() => {})
      .finally(() => {
        if (activo) setCargandoVariantes(false);
      });
    return () => {
      activo = false;
    };
  }, [producto?.id, esPrenda]);

  const tallas = [...new Set(variantes.map((v) => v.talla))];
  const colores = tallaSel
    ? [
        ...new Set(
          variantes
            .filter((v) => v.talla === tallaSel)
            .map((v) => v.color)
        ),
      ]
    : [...new Set(variantes.map((v) => v.color))];

  const varianteSel =
    variantes.find((v) => v.talla === tallaSel && v.color === colorSel) ??
    null;

  const requiereVariante = esPrenda && variantes.length > 0;
  const precioMostrar = varianteSel ? varianteSel.precio : producto?.precio;
  const stockMostrar = varianteSel ? varianteSel.stock : producto?.stock;
  const agotado = stockMostrar === 0;
  const sinVariantesAun = esPrenda && cargandoVariantes;

  const handleAgregar = async () => {
    if (!estaAutenticado()) {
      navigate("/login");
      return;
    }
    if (requiereVariante && !varianteSel) {
      setMensaje("Selecciona la talla y el color.");
      return;
    }
    setAgregando(true);
    setMensaje(null);
    try {
      await agregarProducto(producto, {
        varianteId: varianteSel ? varianteSel.id : null,
        precio: precioMostrar,
      });
    } catch (err) {
      setMensaje(getErrorMessage(err));
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]">
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br ${gradiente}`}
      >
        <button
          type="button"
          onClick={onToggleFavorito}
          aria-label={
            esFavorito
              ? `Quitar ${producto.nombre} de favoritos`
              : `Agregar ${producto.nombre} a favoritos`
          }
          aria-pressed={esFavorito}
          className="absolute right-5 top-5 rounded-full bg-black/30 p-3 backdrop-blur transition hover:scale-110"
        >
          <FaHeart className={esFavorito ? "text-red-500" : "text-white"} />
        </button>

        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
          />
        ) : (
          /* Placeholder: aún no hay foto del producto de la empresa */
          <div className="flex h-full w-full items-center justify-center">
            <FaMugHot className="text-7xl text-white/70 transition duration-500 group-hover:scale-110 dark:text-white/60" />
          </div>
        )}
      </div>

      <div className="p-7">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-cyan-300">
          {producto.categoria}
        </span>

        <h3 className="mt-5 text-2xl font-bold">
          <Link
            to={`/productos/${producto.id}`}
            className="transition hover:text-indigo-600 dark:hover:text-cyan-300"
          >
            {producto.nombre}
          </Link>
        </h3>

        {producto.descripcion && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
            {producto.descripcion}
          </p>
        )}

        {/* Selector de talla/color cuando el producto tiene variantes */}
        {requiereVariante && (
          <div className="mt-4 space-y-3">
            {tallas.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Talla:
                </span>
                {tallas.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTallaSel(t);
                      const coloresDeTalla = [
                        ...new Set(
                          variantes
                            .filter((v) => v.talla === t)
                            .map((v) => v.color)
                        ),
                      ];
                      setColorSel(
                        coloresDeTalla.length === 1 ? coloresDeTalla[0] : null
                      );
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                      tallaSel === t
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {colores.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Color:
                </span>
                {colores.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorSel(c)}
                    title={c}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                      colorSel === c
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {varianteSel && (
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {varianteSel.stock === 0
                  ? "Sin stock para esta talla/color."
                  : `Stock disponible: ${varianteSel.stock}`}
              </p>
            )}
          </div>
        )}

        {mensaje && (
          <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
            {mensaje}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h4 className="text-3xl font-bold">{formatPrice(precioMostrar)}</h4>
        </div>

        <button
          type="button"
          onClick={handleAgregar}
          disabled={agregando || agotado || sinVariantesAun}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
        >
          {agregando ? (
            <FaSpinner className="animate-spin" />
          ) : sinVariantesAun ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaShoppingCart />
          )}
          {sinVariantesAun
            ? "Cargando..."
            : requiereVariante && !varianteSel
              ? "Elige talla y color"
              : agotado
                ? "Agotado"
                : "Agregar al carrito"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
