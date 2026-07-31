import { useState, useEffect } from "react";
import { FaHeart, FaStar, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";

import camiseta from "../../assets/images/products/camiseta.png";
import mug from "../../assets/images/products/mug.png";
import termo from "../../assets/images/products/termo.png";

const products = [
  {
    id: 1,
    name: "Camiseta Oversize",
    price: "$49.900",
    rating: 5,
    category: "Camisetas",
    image: camiseta,
    color: "from-cyan-500 to-blue-700",
  },
  {
    id: 2,
    name: "Mug Premium",
    price: "$29.900",
    rating: 5,
    category: "Mugs",
    image: mug,
    color: "from-violet-500 to-purple-700",
  },
  {
    id: 3,
    name: "Termo Sport",
    price: "$59.900",
    rating: 5,
    category: "Termos",
    image: termo,
    color: "from-emerald-500 to-green-700",
  },
];

function FeaturedProducts() {
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-violet-300">
            Destacados
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Productos populares
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Descubre algunos de los productos favoritos de nuestros clientes y
            personalízalos con tus propias ideas utilizando inteligencia
            artificial.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const isFavorite = favorites.has(product.id);

            return (
              <div
                key={product.id}
                style={{ transitionDelay: mounted ? `${index * 100}ms` : "0ms" }}
                className={`
                  group overflow-hidden rounded-3xl
                  border border-slate-800
                  bg-slate-900
                  transition-all duration-700
                  hover:-translate-y-3
                  hover:border-cyan-500
                  hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]
                  ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
                `}
              >
                <div
                  className={`
                    relative flex h-72 items-center justify-center
                    bg-gradient-to-br ${product.color}
                  `}
                >
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.id)}
                    aria-label={
                      isFavorite
                        ? `Quitar ${product.name} de favoritos`
                        : `Agregar ${product.name} a favoritos`
                    }
                    aria-pressed={isFavorite}
                    className="
                      absolute right-5 top-5
                      rounded-full bg-black/30
                      p-3 backdrop-blur
                      transition hover:scale-110
                    "
                  >
                    <FaHeart
                      className={isFavorite ? "text-red-500" : "text-white"}
                    />
                  </button>

                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="
                      h-64 object-contain
                      transition duration-500
                      group-hover:scale-110
                    "
                  />
                </div>

                <div className="p-7">
                  <span
                    className="
                      rounded-full bg-slate-800
                      px-3 py-1 text-xs
                      text-cyan-300
                    "
                  >
                    {product.category}
                  </span>

                  <h3 className="mt-5 text-2xl font-bold">{product.name}</h3>

                  <div className="mt-4 flex" aria-label={`${product.rating} de 5 estrellas`}>
                    {[...Array(product.rating)].map((_, i) => (
                      <FaStar key={i} className="mr-1 text-yellow-400" />
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <h4 className="text-3xl font-bold">{product.price}</h4>

                    <Link
                      to="/catalogo"
                      className="
                        rounded-xl
                        bg-gradient-to-r
                        from-cyan-500
                        to-violet-600
                        px-5 py-3
                        transition duration-300
                        hover:scale-105
                      "
                    >
                      Personalizar
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center">
          <Link
            to="/catalogo"
            className="
              flex items-center gap-3
              rounded-xl border border-cyan-500
              px-8 py-4 font-semibold
              transition duration-300
              hover:bg-cyan-500
              hover:text-slate-950
            "
          >
            Ver todo el catálogo
            <FaArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;