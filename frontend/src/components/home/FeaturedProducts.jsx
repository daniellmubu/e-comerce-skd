import { FaStar } from "react-icons/fa";
import { Link } from "react-router-dom";

import camiseta from "../../assets/images/products/camiseta.png";
import mug from "../../assets/images/products/mug.png";

const products = [
  {
    id: 1,
    name: "Camiseta Oversize",
    price: "$49.900",
    rating: 5,
    category: "Camisetas",
    image: camiseta,
  },
  {
    id: 2,
    name: "Mug Premium",
    price: "$29.900",
    rating: 5,
    category: "Mugs",
    image: mug,
  },
];

function FeaturedProducts() {
  return (
    <section className="bg-gray-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Más vendidos
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
            >
              <div className="flex h-48 items-center justify-center bg-gray-100 dark:bg-slate-800">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-36 object-contain"
                />
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h3>

                <div className="mt-2 flex" aria-label={`${product.rating} de 5 estrellas`}>
                  {[...Array(product.rating)].map((_, i) => (
                    <FaStar key={i} className="mr-1 text-amber-400" />
                  ))}
                </div>

                <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-cyan-400">
                  {product.price}
                </p>

                <Link
                  to="/catalogo"
                  className="mt-4 block rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-700 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
                >
                  Vista rápida
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
