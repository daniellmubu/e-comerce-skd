import {
  FaTshirt,
  FaMugHot,
  FaHatCowboy,
  FaWineBottle,
  FaArrowRight,
} from "react-icons/fa";

const categories = [
  {
    title: "Camisetas",
    description: "Personaliza camisetas con diseños únicos generados por IA.",
    icon: FaTshirt,
    color: "from-cyan-500 to-blue-600",
  },
  {
    title: "Mugs",
    description: "Sorprende con mugs personalizados para cualquier ocasión.",
    icon: FaMugHot,
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "Gorras",
    description: "Diseños exclusivos para destacar tu estilo.",
    icon: FaHatCowboy,
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Termos",
    description: "Lleva tus diseños favoritos a cualquier lugar.",
    icon: FaWineBottle,
    color: "from-emerald-500 to-green-600",
  },
];

function Categories() {
  return (
    <section className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-16 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            Categorías
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Encuentra el producto perfecto
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Elige el producto que deseas personalizar y deja que la
            inteligencia artificial haga el resto.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {categories.map((category, index) => {
            const Icon = category.icon;

            return (
              <div
                key={index}
                className="group cursor-pointer rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition-all duration-500 hover:-translate-y-3 hover:border-cyan-500 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
              >
                <div
                  className={`mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} text-4xl transition-transform duration-500 group-hover:scale-110`}
                >
                  <Icon />
                </div>

                <h3 className="text-2xl font-bold">
                  {category.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-400">
                  {category.description}
                </p>

                <div className="mt-8 flex items-center gap-2 font-semibold text-cyan-400 transition-all duration-300 group-hover:gap-4">
                  Explorar

                  <FaArrowRight />
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}

export default Categories;