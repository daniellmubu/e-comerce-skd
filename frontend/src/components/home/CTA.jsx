import { useState, useEffect } from "react";
import { FaArrowRight, FaRocket, FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const PAYMENT_METHODS = ["PSE", "Bancolombia", "BBVA", "Nequi", "Tarjetas"];

function CTA() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white">
      <div
        className={`
          relative mx-auto max-w-5xl rounded-3xl border border-slate-800
          bg-gradient-to-br from-cyan-600 via-slate-900 to-violet-700
          px-8 py-16 text-center shadow-2xl
          transition-all duration-700 ease-out
          sm:px-16
          ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
        `}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
          <FaRocket />
          Empieza hoy mismo
        </span>

        <h2 className="mx-auto mt-8 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
          ¿Listo para crear algo único?
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base text-white/80 sm:text-lg">
          Convierte tus ideas en productos reales con inteligencia artificial.
          Es rápido, es tuyo, es único.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-5 sm:flex-row">
          <Link
            to="/registro"
            className="
              flex items-center justify-center gap-3 rounded-xl
              bg-white px-8 py-4 font-semibold text-slate-950
              transition duration-300
              hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]
            "
          >
            Comenzar gratis
            <FaArrowRight />
          </Link>

          <Link
            to="/catalogo"
            className="
              flex items-center justify-center gap-3 rounded-xl
              border border-white/30 px-8 py-4 font-semibold
              transition hover:border-white hover:bg-white/10
            "
          >
            Ver catálogo
          </Link>
        </div>

        {/* Métodos de pago */}
        <div className="mt-10 border-t border-white/10 pt-8">
          <p className="flex items-center justify-center gap-2 text-sm text-white/60">
            <FaShieldAlt />
            Pagos 100% seguros con
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="
                  rounded-full border border-white/20 bg-white/10
                  px-4 py-1.5 text-sm font-medium text-white/90
                  backdrop-blur
                "
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;