import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart, FaStar } from "react-icons/fa";

import camiseta from "../assets/images/products/camiseta.png";
import mug from "../assets/images/products/mug.png";

import { listarMisFavoritos, eliminarFavorito } from "../services/favoritoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

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

function MisFavoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quitando, setQuitando] = useState(null);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  async function cargarFavoritos() {
    setLoading(true);
    try {
      const data = await listarMisFavoritos();
      setFavoritos(data.contenido ?? []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleQuitar(favorito) {
    const id = favorito.producto?.id;
    if (!id || quitando === id) return;

    setQuitando(id);
    try {
      await eliminarFavorito(id);
      setFavoritos((prev) =>
        prev.filter((f) => f.producto?.id !== id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQuitando(null);
    }
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Tu lista de deseos
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Mis favoritos</h1>
          <p className="mt-3 text-gray-500 dark:text-slate-400">
            Los productos que guardaste para más adelante.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loading label="Cargando tus favoritos..." />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={cargarFavoritos}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && favoritos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaRegHeart className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>Todavía no tienes productos favoritos.</p>
            <p className="mt-1 text-sm">
              Toca el corazón de cualquier producto en el catálogo para guardarlo aquí.
            </p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {!loading && !error && favoritos.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {favoritos.map((favorito) => {
              const producto = favorito.producto;
              const meta = CATEGORY_META[producto?.categoria] ?? DEFAULT_META;

              return (
                <div
                  key={favorito.id}
                  className="group overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-500 hover:-translate-y-2 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
                >
                  <div className={`relative flex h-72 items-center justify-center bg-gradient-to-br ${meta.color}`}>
                    <button
                      type="button"
                      onClick={() => handleQuitar(favorito)}
                      disabled={quitando === producto?.id}
                      aria-label={`Quitar ${producto?.nombre} de favoritos`}
                      className="absolute right-5 top-5 rounded-full bg-black/30 p-3 backdrop-blur transition hover:scale-110"
                    >
                      <FaHeart className="text-red-500" />
                    </button>

                    <img
                      src={favorito.imagenUrl || meta.image}
                      alt={producto?.nombre}
                      loading="lazy"
                      className="h-64 object-contain transition duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-7">
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-cyan-300">
                      {producto?.categoria}
                    </span>

                    <h3 className="mt-5 text-2xl font-bold">
                      <Link
                        to={`/productos/${producto?.id}`}
                        className="transition hover:text-indigo-600 dark:hover:text-cyan-300"
                      >
                        {producto?.nombre}
                      </Link>
                    </h3>

                    {producto?.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                        {producto.descripcion}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-1 text-yellow-400">
                      <FaStar />
                      <span className="text-sm">
                        {Number(producto?.promedioCalificacion || 0).toFixed(1)}
                        {producto?.cantidadResenas > 0 &&
                          ` (${producto.cantidadResenas})`}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <h4 className="text-3xl font-bold">
                        {formatPrice(producto?.precio)}
                      </h4>

                      {producto?.stock === 0 ? (
                        <span className="rounded-xl border border-gray-200 px-5 py-3 text-sm text-gray-400 dark:border-slate-700 dark:text-slate-500">
                          Agotado
                        </span>
                      ) : (
                        <Link
                          to={`/productos/${producto?.id}`}
                          className="rounded-xl bg-indigo-600 px-5 py-3 text-white transition duration-300 hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                        >
                          Ver producto
                        </Link>
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

export default MisFavoritos;