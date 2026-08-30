import { FaMugHot, FaBeer, FaWineBottle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const categorias = [
  { title: "Mugs", icon: FaMugHot },
  { title: "Jarras", icon: FaBeer },
  { title: "Botellas", icon: FaWineBottle },
];

function Categories() {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-50 px-6 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          Categorías
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {categorias.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.title}
                type="button"
                onClick={() => navigate("/catalogo")}
                className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white py-10 transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-500"
              >
                <Icon className="text-3xl text-indigo-600 dark:text-cyan-400" />
                <span className="font-medium text-gray-800 dark:text-slate-200">
                  {category.title}
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
