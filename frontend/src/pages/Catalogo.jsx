import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";

import mug from "../assets/images/products/mug.png";
import { buscarProductos } from "../services/productService";
import { listarCategorias } from "../services/categoriaService";
import { agregarFavorito, eliminarFavorito } from "../services/favoritoService";
import { estaAutenticado } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { toast } from "sonner";
import ProductCard from "../components/catalog/ProductCard";

const TAMANIO_PAGINA = 12;

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precioAsc", label: "Precio: menor a mayor" },
  { value: "precioDesc", label: "Precio: mayor a menor" },
];

// El backend solo devuelve el nombre de la categoría (string).
// Mapeamos a la imagen y el gradiente visuales; cualquier categoría
// nueva que no esté aquí cae en el valor por defecto.
const CATEGORY_META = {
  Mugs: { image: mug, color: "from-violet-500 to-purple-700" },
  "Mugs Mágicos": { image: mug, color: "from-fuchsia-500 to-pink-700" },
  "Mágicos": { image: mug, color: "from-fuchsia-500 to-pink-700" },
  Jarras: { image: mug, color: "from-amber-500 to-orange-700" },
  "Jarras cerveceras": { image: mug, color: "from-amber-500 to-orange-700" },
  Termos: { image: mug, color: "from-cyan-500 to-blue-700" },
};

const DEFAULT_META = { image: mug, color: "from-slate-500 to-slate-700" };

function Catalogo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Si llegamos vía el buscador superior (?q=...), prellenamos la búsqueda.
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [categorias, setCategorias] = useState([]);
  const [category, setCategory] = useState(
    () => searchParams.get("categoria") ?? "Todos"
  );
  const [sortBy, setSortBy] = useState("relevancia");
  const [favorites, setFavorites] = useState(new Set());

  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);

  // Debounce de la búsqueda para no pegarle al backend en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPagina(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Cargar las categorías una sola vez (para el filtro nombre → id).
  useEffect(() => {
    listarCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));
  }, []);

  async function cargarProductos() {
    setLoading(true);
    setError(null);
    try {
      const categoriaSel = categorias.find((c) => c.nombre === category);
      const data = await buscarProductos({
        texto: debouncedSearch.trim() || undefined,
        categoriaId:
          category !== "Todos" && categoriaSel ? categoriaSel.id : undefined,
        ordenarPor: sortBy,
        pagina,
        tamanio: TAMANIO_PAGINA,
      });

      setProducts(data?.contenido ?? []);
      setPagina(data?.pagina ?? 0);
      setTotalPaginas(data?.totalPaginas ?? 0);
      setTotal(data?.total ?? 0);
      setFavorites(
        new Set(
          (data?.contenido ?? [])
            .filter((p) => p.esFavorito)
            .map((p) => p.id)
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // Recarga cuando cambian los filtros o la página. Se espera a que las
  // categorías estén listas antes de filtrar por una (para tener su id).
  useEffect(() => {
    if (category !== "Todos" && categorias.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, sortBy, pagina, categorias]);

  const cambiarCategoria = (cat) => {
    setCategory(cat);
    setPagina(0);
  };

  const cambiarOrden = (e) => {
    setSortBy(e.target.value);
    setPagina(0);
  };

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
        toast.success("Agregado a favoritos");
      } else {
        await eliminarFavorito(id);
        toast.success("Quitado de favoritos");
      }
    } catch (err) {
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
      toast.error(getErrorMessage(err));
    }
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
            {["Todos", ...categorias.map((c) => c.nombre)].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => cambiarCategoria(cat)}
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
            onChange={cambiarOrden}
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
            {[...Array(TAMANIO_PAGINA)].map((_, i) => (
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

        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No encontramos productos que coincidan con tu búsqueda.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const meta = CATEGORY_META[product.categoria] ?? DEFAULT_META;
              const isFavorite = favorites.has(product.id);
              return (
                <ProductCard
                  key={product.id}
                  producto={product}
                  imagenFallback={meta.image}
                  gradiente={meta.color}
                  esFavorito={isFavorite}
                  onToggleFavorito={() => toggleFavorite(product.id)}
                />
              );
            })}
          </div>
        )}

        {!loading && !error && totalPaginas > 1 && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              <FaChevronLeft /> Anterior
            </button>

            <span className="text-sm text-gray-500 dark:text-slate-400">
              Página {pagina + 1} de {totalPaginas} · {total}{" "}
              {total === 1 ? "producto" : "productos"}
            </span>

            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina >= totalPaginas - 1}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              Siguiente <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Catalogo;