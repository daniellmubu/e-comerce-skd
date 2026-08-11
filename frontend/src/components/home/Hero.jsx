import { useEffect, useState } from "react";
import { FaMagic, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Hero() {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Fondo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl [animation-delay:1s]"></div>
      </div>

      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center px-6 py-20 sm:px-8 lg:flex-row lg:items-center lg:py-0">
        {/* Lado izquierdo */}
        <div
          className={`w-full text-center transition-all duration-700 ease-out lg:w-1/2 lg:text-left ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 sm:text-base">
            ✨ IA para personalización
          </span>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Diseña productos
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              únicos con IA
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-slate-300 sm:text-lg lg:mx-0">
            Personaliza camisetas, mugs, termos y mucho más utilizando
            inteligencia artificial para convertir tus ideas en diseños
            increíbles.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-5 sm:flex-row lg:justify-start">
            <button
              type="button"
              onClick={() => navigate("/generador")}
              aria-label="Ir al generador de diseños con IA"
              className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 font-semibold transition duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]"
            >
              <FaMagic />
              Diseñar ahora
            </button>

            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              aria-label="Ver catálogo de productos"
              className="flex items-center justify-center gap-3 rounded-xl border border-slate-700 px-8 py-4 transition hover:border-cyan-400 hover:text-cyan-400"
            >
              Ver catálogo
              <FaArrowRight />
            </button>
          </div>
        </div>

        {/* Lado derecho */}
        <div
          className={`mt-16 hidden w-full justify-center transition-all delay-150 duration-700 ease-out lg:mt-0 lg:flex lg:w-1/2 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="relative h-[430px] w-[380px] rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm text-slate-400">SKD AI Studio</span>

              <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                Online
              </span>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-slate-400">Producto</p>
                <h3 className="mt-1 text-xl font-bold">Camiseta Premium</h3>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="text-slate-400">Diseño generado por IA</p>

                <div className="mt-3 h-36 rounded-lg bg-gradient-to-br from-cyan-500 via-slate-800 to-violet-600"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-800 p-4 text-center">
                  <h4 className="text-2xl font-bold text-cyan-400">+500</h4>
                  <p className="text-sm text-slate-400">Diseños</p>
                </div>

                <div className="rounded-xl bg-slate-800 p-4 text-center">
                  <h4 className="text-2xl font-bold text-violet-400">IA</h4>
                  <p className="text-sm text-slate-400">Personalización</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;