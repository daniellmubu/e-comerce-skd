import { Link } from "react-router-dom";
import { FaCompass, FaArrowLeft } from "react-icons/fa";

function NoEncontrado() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center dark:bg-slate-950">
      <div className="max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-400">
          <FaCompass />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mt-3 text-gray-500 dark:text-slate-400">
          Esta página no existe o fue movida. Revisa el enlace o vuelve al
          inicio.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
        >
          <FaArrowLeft /> Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default NoEncontrado;