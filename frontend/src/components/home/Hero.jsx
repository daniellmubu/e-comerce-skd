import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-20 text-center text-white dark:from-cyan-600 dark:to-violet-700">
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Personaliza tus productos
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-indigo-100 dark:text-slate-200">
          Crea diseños únicos en pocillos, camisetas y más
        </p>
        <button
          type="button"
          onClick={() => navigate("/catalogo")}
          className="mt-8 rounded-xl bg-white px-8 py-3 font-semibold text-indigo-600 transition hover:scale-105 dark:text-violet-700"
        >
          Ver Catálogo
        </button>
      </div>
    </section>
  );
}

export default Hero;
