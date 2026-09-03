import { useNavigate } from "react-router-dom";
import { FaMugHot, FaMagic, FaCheckCircle, FaTruck } from "react-icons/fa";

const PASOS = [
  {
    icon: FaMugHot,
    titulo: "Elige tu producto",
    texto: "Mug, mug mágico, jarra o termo: empieza por tu favorito.",
  },
  {
    icon: FaMagic,
    titulo: "Diseña con IA",
    texto: "Describe tu idea o usa diseño asistido y la creamos por ti.",
  },
  {
    icon: FaCheckCircle,
    titulo: "Aprobamos tu diseño",
    texto: "Lo revisamos, lo estampamos con sublimación de alta calidad.",
  },
  {
    icon: FaTruck,
    titulo: "Recíbelo en casa",
    texto: "Te lo enviamos con seguimiento hasta tu puerta.",
  },
];

function ComoFunciona() {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            ¿Cómo funciona?
          </span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            De tu idea a tu puerta en 4 pasos
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-500 dark:text-slate-400">
            Un proceso simple para que consigas un producto único.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map((paso, index) => {
            const Icon = paso.icon;
            return (
              <div
                key={paso.titulo}
                className="relative rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70"
              >
                <span className="absolute right-5 top-5 text-4xl font-black text-gray-100 dark:text-slate-800">
                  {index + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                  <Icon />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
                  {paso.titulo}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {paso.texto}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => navigate("/personalizador")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-semibold text-white transition hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            <FaMagic /> Comenzar a diseñar
          </button>
        </div>
      </div>
    </section>
  );
}

export default ComoFunciona;