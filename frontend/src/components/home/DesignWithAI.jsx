import { useState } from "react";
import { FaMagic, FaArrowRight, FaSpinner } from "react-icons/fa";
import { Link } from "react-router-dom";

const EXAMPLE_PROMPTS = [
  "Camiseta negra con un dragón japonés en tonos azules, estilo cyberpunk",
  "Mug blanco con un astronauta minimalista flotando entre estrellas",
];

function DesignWithAI() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setHasResult(false);

    // Simulación de generación — se reemplazará por la llamada real a la IA
    setTimeout(() => {
      setIsGenerating(false);
      setHasResult(true);
    }, 1800);
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
  };

  return (
    <section
      id="diseno-ia"
      className="relative overflow-hidden bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white"
    >
      {/* Fondo */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            ✨ Diseña con IA
          </span>

          <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
            Escribe tu idea,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              nosotros la diseñamos
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-gray-500 dark:text-slate-400">
            Describe el diseño que imaginas y nuestra IA lo convertirá en un
            producto único en segundos.
          </p>
        </div>

        {/* Caja de prompt */}
        <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-2xl dark:backdrop-blur">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Quiero un mug negro con un dragón japonés en tonos azules y un estilo cyberpunk."
            rows={4}
            className="
              w-full resize-none rounded-2xl border border-gray-200 bg-gray-50
              p-5 text-gray-800 placeholder:text-gray-400
              transition focus:border-indigo-400 focus:outline-none
              focus:ring-2 focus:ring-indigo-500/20
              dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30
            "
          />

          {/* Prompts de ejemplo */}
          <div className="mt-5 flex flex-wrap gap-3">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="
                  rounded-full border border-slate-700 bg-slate-800/60
                  px-4 py-2 text-sm text-slate-300
                  transition hover:border-cyan-400 hover:text-cyan-300
                "
              >
                {example.length > 45 ? `${example.slice(0, 45)}…` : example}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="
                flex items-center gap-3 rounded-xl
                bg-gradient-to-r from-indigo-600 to-violet-600
                px-8 py-4 font-semibold text-white
                transition duration-300
                hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]
                disabled:cursor-not-allowed disabled:opacity-40
                disabled:hover:scale-100 disabled:hover:shadow-none
              "
            >
              {isGenerating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Generando diseño...
                </>
              ) : (
                <>
                  <FaMagic />
                  Generar diseño
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultado */}
        {(isGenerating || hasResult) && (
          <div className="mt-10 flex flex-col items-center gap-6">
            <div
              className={`
                relative flex h-64 w-64 items-center justify-center
                overflow-hidden rounded-3xl border border-gray-200
                bg-gradient-to-br from-cyan-500 via-slate-800 to-violet-600
                dark:border-slate-800
                transition-all duration-700
                ${hasResult ? "scale-100 opacity-100" : "scale-95 opacity-60"}
              `}
            >
              {isGenerating && (
                <FaSpinner className="animate-spin text-4xl text-white/80" />
              )}
            </div>

            {hasResult && (
              <div className="text-center">
                <p className="text-gray-500 dark:text-slate-400">
                  ¡Tu diseño está listo! Regístrate para guardarlo y llevarlo
                  a un producto real.
                </p>

                <Link
                  to="/registro"
                  className="
                    mt-4 inline-flex items-center gap-3
                    rounded-xl border border-cyan-500
                    px-6 py-3 font-semibold
                    transition duration-300
                    hover:bg-cyan-500 hover:text-slate-950
                  "
                >
                  Guardar mi diseño
                  <FaArrowRight />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default DesignWithAI;