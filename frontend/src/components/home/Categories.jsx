import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMugHot, FaBeer, FaFire } from "react-icons/fa";
import { Link } from "react-router-dom";

import { listarCategorias } from "../../services/categoriaService";

const ICONOS = {
  Mugs: FaMugHot,
  Jarras: FaBeer,
  Termos: FaFire,
};

const GRADIENTES = {
  Mugs: "from-violet-500 to-purple-700",
  Jarras: "from-amber-500 to-orange-700",
  Termos: "from-cyan-500 to-blue-700",
};

const FALLBACK = { icon: FaMugHot, gradiente: "from-slate-500 to-slate-700" };

function Categories() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    listarCategorias()
      .then((data) => setCategorias(Array.isArray(data) ? data : []))
      .catch(() => setCategorias([]));
  }, []);

  return (
    <section className="bg-gray-50 px-6 pb-4 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Categorías
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Explora por tipo de producto.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="text-sm font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
          >
            Ver todo
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((cat) => {
            const meta = ICONOS[cat.nombre]
              ? {
                  icon: ICONOS[cat.nombre],
                  gradiente: GRADIENTES[cat.nombre],
                }
              : FALLBACK;
            const Icon = meta.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/catalogo?categoria=${encodeURIComponent(cat.nombre)}`)}
                className={`group flex items-center gap-4 rounded-2xl bg-gradient-to-br ${meta.gradiente} p-6 text-left text-white shadow transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur">
                  <Icon />
                </span>
                <span>
                  <span className="block text-lg font-bold">{cat.nombre}</span>
                  <span className="text-sm text-white/80 group-hover:underline">
                    Ver productos →
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Categories;