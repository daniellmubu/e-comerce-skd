import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaStar, FaShoppingCart, FaMagic, FaArrowLeft } from "react-icons/fa";

import camiseta from "../assets/images/products/camiseta.png";
import mug from "../assets/images/products/mug.png";
import { obtenerProductoPorId, obtenerVariantesDeProducto, listarProductos } from "../services/productService";
import { listarResenasPorProducto } from "../services/resenaService";
import { listarCaracteristicasPorProducto } from "../services/caracteristicaService";
import { getErrorMessage } from "../services/api";
import { useCart } from "../context/CartContext";
import Loading from "../components/ui/Loading";

// Igual que en Catalogo.jsx: el backend solo da el nombre de la categoría,
// así que mapeamos a la imagen de referencia que ya usa el resto del sitio.
const CATEGORY_META = {
  Camisetas: { image: camiseta, color: "from-cyan-500 to-blue-700" },
  Mugs: { image: mug, color: "from-violet-500 to-purple-700" },
};
const DEFAULT_META = { image: camiseta, color: "from-slate-500 to-slate-700" };

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function Estrellas({ calificacion = 0 }) {
  const llenas = Math.round(calificacion);
  return (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} className={n <= llenas ? "" : "text-slate-700"} />
      ))}
    </div>
  );
}

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarProducto } = useCart();

  const [producto, setProducto] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [relacionados, setRelacionados] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [tallaSel, setTallaSel] = useState(null);
  const [colorSel, setColorSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerProductoPorId(id),
      listarResenasPorProducto(id).catch(() => []),
      listarCaracteristicasPorProducto(id).catch(() => []),
      listarProductos().catch(() => []),
      obtenerVariantesDeProducto(id).catch(() => []),
    ])
      .then(
        ([productoData, resenasData, caracteristicasData, todos, variantesData]) => {
          if (!activo) return;
          setProducto(productoData);
          setResenas(resenasData);
          setCaracteristicas(caracteristicasData);
          setVariantes(Array.isArray(variantesData) ? variantesData : []);
          setRelacionados(
            todos
              .filter((p) => p.id !== productoData.id && p.categoria === productoData.categoria)
              .slice(0, 4)
          );

          // Auto-selección: si el producto tiene una sola talla o un solo color,
          // queda preseleccionado para que el usuario no tenga que elegir.
          if (Array.isArray(variantesData) && variantesData.length > 0) {
            const tallasUnicas = [...new Set(variantesData.map((v) => v.talla))];
            const coloresUnicos = [...new Set(variantesData.map((v) => v.color))];
            if (tallasUnicas.length === 1) setTallaSel(tallasUnicas[0]);
            if (coloresUnicos.length === 1) setColorSel(coloresUnicos[0]);
          }

          setLoading(false);
        }
      )
      .catch((err) => {
        if (!activo) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const meta = useMemo(
    () => (producto ? CATEGORY_META[producto.categoria] ?? DEFAULT_META : DEFAULT_META),
    [producto]
  );

  // Variantes: tallas y colores disponibles, y la variante seleccionada.
  const tallas = useMemo(
    () => [...new Set(variantes.map((v) => v.talla))],
    [variantes]
  );
  const colores = useMemo(() => {
    const base = tallaSel
      ? variantes.filter((v) => v.talla === tallaSel)
      : variantes;
    return [...new Set(base.map((v) => v.color))];
  }, [variantes, tallaSel]);

  const varianteSel = useMemo(
    () =>
      variantes.find(
        (v) => v.talla === tallaSel && v.color === colorSel
      ) ?? null,
    [variantes, tallaSel, colorSel]
  );

  const precioMostrar = varianteSel ? varianteSel.precio : producto?.precio;
  const stockMostrar = varianteSel ? varianteSel.stock : producto?.stock;

  const handlePersonalizar = () => {
    navigate("/personalizador", { state: producto });
  };

  if (loading) {
    return <Loading fullScreen label="Cargando producto..." />;
  }

  if (error || !producto) {
    return (
      <section className="min-h-screen bg-gray-50 px-6 py-24 text-center text-gray-900 dark:bg-slate-950 dark:text-white">
        <p className="text-red-500 dark:text-red-400">{error || "Producto no encontrado."}</p>
        <button
          type="button"
          onClick={() => navigate("/catalogo")}
          className="mt-6 rounded-xl border border-gray-200 px-6 py-3 text-gray-600 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
        >
          Volver al catálogo
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/catalogo"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-cyan-300"
        >
          <FaArrowLeft /> Volver al catálogo
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Imagen */}
          <div>
            <div
              className={`flex h-96 items-center justify-center rounded-3xl bg-gradient-to-br ${meta.color}`}
            >
              <img
                src={producto.imagenUrl || meta.image}
                alt={producto.nombre}
                className="h-72 object-contain"
              />
            </div>

            {/* Miniaturas de vistas del producto */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="flex h-20 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400 transition hover:ring-2 hover:ring-indigo-300 dark:bg-slate-800 dark:text-slate-500 dark:hover:ring-cyan-500"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-cyan-300">
              {producto.categoria}
            </span>

            <h1 className="mt-4 text-4xl font-bold">{producto.nombre}</h1>

            <div className="mt-3 flex items-center gap-3">
              <Estrellas calificacion={producto.calificacionPromedio ?? 0} />
              <span className="text-sm text-gray-500 dark:text-slate-400">
                ({producto.totalResenas ?? 0} reseñas)
              </span>
            </div>

            <p className="mt-6 text-4xl font-bold text-indigo-600 dark:text-cyan-300">
              {formatPrice(precioMostrar)}
            </p>

            {variantes.length > 0 && (
              <div className="mt-6 space-y-5">
                {/* Talla */}
                {tallas.length > 1 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Talla
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                            tallaSel === t
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                              : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color */}
                {colores.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colores.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColorSel(c)}
                          aria-label={`Color ${c}`}
                          title={c}
                          className={`flex h-9 items-center justify-center rounded-full border px-3 text-xs font-medium transition ${
                            colorSel === c
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-500/40"
                              : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {varianteSel
                    ? `Stock disponible: ${stockMostrar}`
                    : "Selecciona una talla y un color."}
                </p>
              </div>
            )}

            <div className="my-8 border-t border-gray-200 dark:border-slate-800" />

            {producto.descripcion && (
              <>
                <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
                <p className="text-gray-500 dark:text-slate-400">{producto.descripcion}</p>
              </>
            )}

            {caracteristicas.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Características</h2>
                <ul className="space-y-2 text-gray-500 dark:text-slate-400">
                  {caracteristicas.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-cyan-400" />
                      {c.texto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="my-8 border-t border-gray-200 dark:border-slate-800" />

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handlePersonalizar}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                <FaMagic /> Personalizar
              </button>
              <button
                type="button"
                onClick={() =>
                  agregarProducto(producto, {
                    varianteId: varianteSel?.id ?? null,
                    precio: precioMostrar,
                  })
                }
                disabled={
                  (variantes.length > 0 && !varianteSel) || stockMostrar === 0
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-4 font-semibold transition hover:border-indigo-400 dark:border-slate-700 dark:hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FaShoppingCart />
                {(variantes.length > 0 && !varianteSel) || stockMostrar === 0
                  ? "Agotado"
                  : "Agregar al carrito"}
              </button>
            </div>
          </div>
        </div>

        {/* Reseñas */}
        {resenas.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-6 text-2xl font-bold">Reseñas de clientes</h2>
            <div className="space-y-4">
              {resenas.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.usuario}</p>
                    <Estrellas calificacion={r.calificacion} />
                  </div>
                  {r.comentario && (
                    <p className="mt-2 text-gray-500 dark:text-slate-400">{r.comentario}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos relacionados */}
        {relacionados.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-6 text-2xl font-bold">Productos relacionados</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relacionados.map((p) => {
                const relMeta = CATEGORY_META[p.categoria] ?? DEFAULT_META;
                return (
                  <Link
                    key={p.id}
                    to={`/productos/${p.id}`}
                    className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
                  >
                    <div
                      className={`flex h-40 items-center justify-center bg-gradient-to-br ${relMeta.color}`}
                    >
                      <img
                        src={relMeta.image}
                        alt={p.nombre}
                        className="h-28 object-contain transition group-hover:scale-110"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="mt-1 text-indigo-600 dark:text-cyan-300">{formatPrice(p.precio)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default DetalleProducto;
