import { useNavigate } from "react-router-dom";
import { FaMagic, FaPenNib, FaShieldAlt, FaTruck } from "react-icons/fa";

function CtaDiseno() {
  const navigate = useNavigate();

  return (
    <section className="bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-16 text-center text-white shadow-lg sm:px-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
          <FaMagic /> Empieza hoy mismo
        </span>
        <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          ¿Listo para crear algo único?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-indigo-100 dark:text-slate-200">
          Diseña tú mismo con IA o deja que nuestro equipo lo haga por ti.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/personalizador")}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-indigo-700 transition hover:scale-105"
          >
            <FaMagic /> Diseña con IA
          </button>
          <button
            type="button"
            onClick={() => navigate("/solicitar-diseno")}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/40 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
          >
            <FaPenNib /> Diseño asistido
          </button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-100 dark:text-slate-200">
          <span className="flex items-center gap-2">
            <FaShieldAlt /> Pago seguro
          </span>
          <span className="flex items-center gap-2">
            <FaTruck /> Envío a todo el país
          </span>
        </div>
      </div>
    </section>
  );
}

export default CtaDiseno;