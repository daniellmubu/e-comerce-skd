import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import ProductCard from "../catalog/ProductCard";
import { buscarProductos } from "../../services/productService";
import { agregarFavorito, eliminarFavorito } from "../../services/favoritoService";
import { estaAutenticado } from "../../services/authService";
import { getErrorMessage } from "../../services/api";

const GRADIENTE_CAT = {
  Mugs: "from-violet-500 to-purple-700",
  Jarras: "from-amber-500 to-orange-700",
};

function FeaturedProducts() {
  const [productos, setProductos] = useState([]);
  const [favoritos, setFavoritos] = useState(new Set());
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    buscarProductos({ tamanio: 8 })
      .then((data) => {
        if (!activo) return;
        setProductos(data?.contenido ?? []);
        setFavoritos(
          new Set((data?.contenido ?? []).filter((p) => p.esFavorito).map((p) => p.id))
        );
      })
      .catch(() => {})
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const toggleFavorito = async (id) => {
    if (!estaAutenticado()) {
      window.location.href = "/login";
      return;
    }
    const agregando = !favoritos.has(id);
    setFavoritos((prev) => {
      const next = new Set(prev);
      if (agregando) next.add(id);
      else next.delete(id);
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
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (agregando) next.delete(id);
        else next.add(id);
        return next;
      });
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <section className="bg-gray-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Productos destacados
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Los favoritos de nuestros clientes.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="text-sm font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
          >
            Ver catálogo
          </Link>
        </div>

        {cargando ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-3xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {productos.map((p) => (
              <ProductCard
                key={p.id}
                producto={p}
                gradiente={GRADIENTE_CAT[p.categoria] || "from-slate-500 to-slate-700"}
                esFavorito={favoritos.has(p.id)}
                onToggleFavorito={() => toggleFavorito(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;