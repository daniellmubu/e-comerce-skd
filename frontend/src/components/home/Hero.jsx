import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaShieldAlt, FaTruck, FaMagic } from "react-icons/fa";

function Hero() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");

  const buscar = (e) => {
    if (e.key !== "Enter") return;
    const texto = busqueda.trim();
    navigate(texto ? `/catalogo?q=${encodeURIComponent(texto)}` : "/catalogo");
  };

  const buscarClick = () => {
    const texto = busqueda.trim();
    navigate(texto ? `/catalogo?q=${encodeURIComponent(texto)}` : "/catalogo");
  };

  return (
    <section className="bg-gray-50 px-6 pb-12 pt-10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 text-white sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              <FaMagic /> Diseños únicos en sublimación
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
              Personaliza tus mugs, jarras y termos
            </h1>
            <p className="mt-4 max-w-lg text-indigo-100 dark:text-slate-200">
              Crea con IA o elige un diseño listo y recíbelo en tu puerta.
            </p>

            {/* Buscador grande */}
            <div className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl">
              <FaSearch className="ml-2 shrink-0 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={buscar}
                placeholder="Busca mugs, jarras, termos..."
                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={buscarClick}
                className="shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Buscar
              </button>
            </div>

            {/* Confianza */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-indigo-100 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <FaTruck /> Envío a todo el país
              </span>
              <span className="flex items-center gap-2">
                <FaShieldAlt /> Pago seguro
              </span>
              <span className="flex items-center gap-2">
                <FaMagic /> Diseño con IA
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;