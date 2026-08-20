import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch, FaHeart } from "react-icons/fa";

import camiseta from "../assets/images/products/camiseta.png";
import mug from "../assets/images/products/mug.png";
import { listarProductos } from "../services/productService";
import { agregarFavorito, eliminarFavorito } from "../services/favoritoService";
import { estaAutenticado } from "../services/authService";
import { getErrorMessage } from "../services/api";

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "menor", label: "Precio: menor a mayor" },
  { value: "mayor", label: "Precio: mayor a menor" },
];

// El backend solo devuelve el nombre de la categoría (string).
// Mapeamos a la imagen y el gradiente visuales; cualquier categoría
// nueva que no esté aquí cae en el valor por defecto.
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

function Catalogo() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState("relevancia");
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    setLoading(true);
    setError(null);
    try {
      const data = await listarProductos();
      setProducts(data.filter((p) => p.activo !== false));
      // El backend marca esFavorito cuando el usuario está logueado;
      // con eso sembramos el estado local del corazón.
      setFavorites(
        new Set(data.filter((p) => p.esFavorito).map((p) => p.id))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.categoria).filter(Boolean))];
    return ["Todos", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (category !== "Todos") {
      result = result.filter((product) => product.categoria === category);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter((product) =>
        product.nombre.toLowerCase().includes(query)
      );
    }

    if (sortBy === "menor") {
      result.sort((a, b) => a.precio - b.precio);
    } else if (sortBy === "mayor") {
      result.sort((a, b) => b.precio - a.precio);
    }

    return result;
  }, [products, search, category, sortBy]);

  // Persiste el favorito en el backend (POST/DELETE) y actualiza el estado
  // local de forma optimista; si la petición falla, revierte el cambio.
  const toggleFavorite = async (id) => {
    if (!estaAutenticado()) {
      navigate("/login");
      return;
    }

    const agregando = !favorites.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (agregando) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

    try {
      if (agregando) {
        await agregarFavorito(id);
      } else {
        await eliminarFavorito(id);
      }
    } catch {
      // Revierte el cambio local si el backend rechazó la petición.
      setFavorites((prev) => {
        const next = new Set(prev);
        if (agregando) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const handlePersonalizar = (product) => {
    navigate("/personalizador", { state: product });
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Catálogo
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Elige tu producto
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-gray-500 dark:text-slate-400">
            Explora nuestros productos y personalízalos con IA.
          </p>
        </div>

        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  category === cat
                    ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-cyan-400 dark:bg-cyan-400/10 dark:text-cyan-300"
                    : "border-gray-200 text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-3xl border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={cargarProductos}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No encontramos productos que coincidan con tu búsqueda.
          </div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const meta = CATEGORY_META[product.categoria] ?? DEFAULT_META;
              const isFavorite = favorites.has(product.id);

              return (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
                >
                  <div
                    className={`relative flex h-72 items-center justify-center bg-gradient-to-br ${meta.color}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      aria-label={
                        isFavorite
                          ? `Quitar ${product.nombre} de favoritos`
                          : `Agregar ${product.nombre} a favoritos`
                      }
                      aria-pressed={isFavorite}
                      className="absolute right-5 top-5 rounded-full bg-black/30 p-3 backdrop-blur transition hover:scale-110"
                    >
                      <FaHeart className={isFavorite ? "text-red-500" : "text-white"} />
                    </button>

                    <img
                      src={meta.image}
                      alt={product.nombre}
                      loading="lazy"
                      className="h-64 object-contain transition duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-7">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-cyan-300">
                      {product.categoria}
                    </span>

                    <h3 className="mt-5 text-2xl font-bold">
                      <Link to={`/productos/${product.id}`} className="transition hover:text-indigo-600 dark:hover:text-cyan-300">
                        {product.nombre}
                      </Link>
                    </h3>

                    {product.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                        {product.descripcion}
                      </p>
                    )}

                    <div className="mt-6 flex items-center justify-between">
                      <h4 className="text-3xl font-bold">
                        {formatPrice(product.precio)}
                      </h4>

                      {product.stock === 0 ? (
                        <span className="rounded-xl border border-gray-200 px-5 py-3 text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
                          Agotado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePersonalizar(product)}
                          className="rounded-xl bg-indigo-600 px-5 py-3 text-white transition duration-300 hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600 dark:hover:bg-none"
                        >
                          Personalizar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Catalogo;