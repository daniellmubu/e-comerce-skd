import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaImages } from "react-icons/fa";

import { listarGaleria } from "../services/galeriaService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

function Estrellas({ calificacion = 0 }) {
  const llenas = Math.round(calificacion);
  return (
    <div className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} className={n <= llenas ? "" : "text-slate-300 dark:text-slate-600"} size={14} />
      ))}
    </div>
  );
}

function GaleriaClientes() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    listarGaleria(page, 12)
      .then((data) => {
        if (!activo) return;
        setItems(data.content ?? []);
        setTotalPaginas(data.totalPaginas ?? 0);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setError(getErrorMessage(err));
        setCargando(false);
      });
    return () => { activo = false; };
  }, [page]);

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <span className="rounded-full border border-violet-300 bg-violet-50 px-4 py-2 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
            Social proof
          </span>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">Galería de clientes</h1>
          <p className="mt-2 text-gray-500 dark:text-slate-400">Fotos reales de quienes ya compraron y dejaron su reseña.</p>
        </div>

        {cargando ? (
          <div className="flex justify-center py-16"><Loading label="Cargando galería..." /></div>
        ) : error ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center dark:border-slate-700">
            <FaImages className="mb-4 text-4xl text-gray-300 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">Aún no hay fotos de clientes.</p>
            <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">¡Sé el primero en dejar una reseña con foto!</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <div key={it.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-slate-800">
                    <img src={it.imagenUrl} alt={it.productoNombre} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <Link to={`/productos/${it.productoId}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-cyan-300">{it.productoNombre}</Link>
                      <Estrellas calificacion={it.calificacion} />
                    </div>
                    {it.comentario && <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-slate-300">“{it.comentario}”</p>}
                    <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">por {it.usuarioNombre}</p>
                  </div>
                </div>
              ))}
            </div>
            {totalPaginas > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  Página {page + 1} de {totalPaginas}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPaginas}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default GaleriaClientes;
