import { useState, useEffect } from "react";
import { FaEye } from "react-icons/fa";

import mug from "../../assets/images/products/mug.png";

const designs = [
  {
    title: "Cyber Samurai",
    category: "Mugs",
    image: mug,
  },
  {
    title: "Neon Dragon",
    category: "Mugs",
    image: mug,
  },
];

function Gallery() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="bg-white px-6 py-16 text-gray-900 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
            Inspiración
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Diseños creados con IA
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-gray-500 dark:text-slate-400">
            Explora algunas creaciones y descubre lo que puedes crear con tu
            imaginación.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          {designs.map((design, index) => (
            <div
              key={design.title}
              style={{ transitionDelay: mounted ? `${index * 100}ms` : "0ms" }}
              className={`
                group overflow-hidden rounded-3xl
                border border-gray-200
                bg-gray-100
                transition-all duration-700
                hover:-translate-y-3
                hover:border-purple-400
                dark:border-slate-800 dark:bg-slate-950 dark:hover:border-purple-500
                ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
              `}
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={design.image}
                  alt={design.title}
                  loading="lazy"
                  className="
                    h-full w-full object-cover
                    transition duration-500
                    group-hover:scale-110
                  "
                />

                <div
                  className="
                    absolute inset-0 flex items-center justify-center
                    bg-slate-950/0 opacity-0
                    transition duration-300
                    group-hover:bg-slate-950/50 group-hover:opacity-100
                  "
                >
                  <FaEye className="text-3xl text-white" />
                </div>
              </div>

              <div className="p-6">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-purple-300">
                  {design.category}
                </span>

                <h3 className="mt-4 text-2xl font-bold">{design.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Gallery;