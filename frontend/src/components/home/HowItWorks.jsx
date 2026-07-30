import {
  FaPenFancy,
  FaRobot,
  FaPalette,
  FaShoppingCart,
} from "react-icons/fa";

const steps = [
  {
    id: "01",
    title: "Describe tu idea",
    description:
      "Escribe cómo imaginas tu diseño. Puedes indicar colores, estilo, personajes, frases o cualquier detalle.",
    icon: FaPenFancy,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "02",
    title: "La IA crea el diseño",
    description:
      "Nuestro asistente interpreta tu idea y genera una propuesta personalizada utilizando inteligencia artificial.",
    icon: FaRobot,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "03",
    title: "Personaliza el resultado",
    description:
      "Ajusta tamaño, posición y otros detalles del diseño antes de enviarlo a producción.",
    icon: FaPalette,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "04",
    title: "Compra y recibe",
    description:
      "Finaliza tu pedido y nosotros nos encargamos de producir y enviar tu producto personalizado.",
    icon: FaShoppingCart,
    color: "from-emerald-500 to-green-600",
  },
];

function HowItWorks() {
  return (
    <section className="bg-slate-900 px-6 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            ¿Cómo funciona?
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Crea productos en cuatro pasos
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Diseñamos una experiencia simple para que cualquier persona pueda
            convertir una idea en un producto personalizado.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-8 transition-all duration-500 hover:-translate-y-3 hover:border-cyan-500 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
              >
                <span className="absolute right-6 top-6 text-6xl font-extrabold text-white/5">
                  {step.id}
                </span>

                <div
                  className={`mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-4xl transition-transform duration-500 group-hover:scale-110`}
                >
                  <Icon />
                </div>

                <h3 className="text-2xl font-bold">
                  {step.title}
                </h3>

                <p className="mt-5 leading-7 text-slate-400">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;