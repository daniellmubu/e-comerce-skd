import { useState, useEffect } from "react";
import { FaBrain, FaPalette, FaShieldAlt, FaGem } from "react-icons/fa";

const benefits = [
  {
    icon: FaBrain,
    title: "IA que entiende tu idea",
    description:
      "Nada de plantillas genéricas. Nuestra IA convierte tu prompt en un diseño único, pensado a partir de lo que realmente imaginas.",
  },
  {
    icon: FaPalette,
    title: "Personalización real",
    description:
      "Edita, ajusta colores y aplica tu diseño sobre distintos productos hasta que quede exactamente como lo quieres.",
  },
  {
    icon: FaShieldAlt,
    title: "Pagos locales seguros",
    description:
      "Paga con PSE, Bancolombia, BBVA y más — de forma simple, rápida y segura, sin complicaciones.",
  },
  {
    icon: FaGem,
    title: "Calidad de impresión premium",
    description:
      "Sublimación de alta durabilidad: tu diseño se mantiene vivo, nítido y resistente en cada producto.",
  },
];

function Benefits() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            ¿Por qué SKD?
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Diseñado para que confíes en el proceso
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            De la idea al producto final, cada paso está pensado para que
            sea simple, seguro y de calidad.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                style={{
                  transitionDelay: mounted ? `${index * 100}ms` : "0ms",
                }}
                className={`
                  rounded-3xl border border-slate-800 bg-slate-900
                  p-7
                  transition-all duration-700
                  hover:-translate-y-2
                  hover:border-cyan-500
                  hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]
                  ${
                    mounted
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0"
                  }
                `}
              >
                <div
                  className="
                    flex h-14 w-14 items-center justify-center
                    rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600
                    text-2xl
                  "
                >
                  <Icon />
                </div>

                <h3 className="mt-6 text-xl font-bold">{benefit.title}</h3>

                <p className="mt-3 text-sm text-slate-400">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Benefits;