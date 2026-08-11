import { useState, useMemo } from "react";
import { FaMagic, FaSpinner, FaArrowRight, FaTimes, FaLock } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

import camiseta from "../assets/images/products/camiseta.png";
import mug from "../assets/images/products/mug.png";
import termo from "../assets/images/products/termo.png";
import { useAuth } from "../context/AuthContext";
import { generarDiseno } from "../services/disenoService";
import { getErrorMessage } from "../services/api";

const PRODUCT_TYPES = [
  { id: "camiseta", name: "Camiseta", image: camiseta },
  { id: "mug", name: "Mug", image: mug },
  { id: "termo", name: "Termo", image: termo },
];

// El Catálogo manda la categoría tal como la devuelve el backend
// ("Camisetas", "Mugs", "Termos"); acá la traducimos al id interno
// que usan las tarjetas de producto de este componente.
const CATEGORIA_TO_TIPO = {
  Camisetas: "camiseta",
  Mugs: "mug",
  Termos: "termo",
};

const STYLES = ["Minimalista", "Cyberpunk", "Acuarela", "Line Art", "Retro"];

const COLORS = [
  { id: "cyan", label: "Cyan", classes: "from-cyan-500 to-blue-700" },
  { id: "violet", label: "Violeta", classes: "from-violet-500 to-purple-700" },
  { id: "pink", label: "Rosa", classes: "from-pink-500 to-rose-700" },
  { id: "emerald", label: "Verde", classes: "from-emerald-500 to-green-700" },
  { id: "amber", label: "Ámbar", classes: "from-amber-500 to-orange-700" },
];

function Generador() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Producto elegido en el Catálogo (si se llegó vía "Personalizar").
  // Si se entra directo a /generador, location.state es null y todo
  // funciona igual que antes, con selección libre.
  const [productoOrigen, setProductoOrigen] = useState(location.state ?? null);

  const [prompt, setPrompt] = useState("");
  const [productType, setProductType] = useState(
    () => CATEGORIA_TO_TIPO[location.state?.categoria] ?? PRODUCT_TYPES[0].id
  );
  const [style, setStyle] = useState(STYLES[0]);
  const [color, setColor] = useState(COLORS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [imagenGenerada, setImagenGenerada] = useState(null);
  const [errorGeneracion, setErrorGeneracion] = useState(null);

  const selectedProduct = useMemo(
    () => PRODUCT_TYPES.find((p) => p.id === productType),
    [productType]
  );

  const selectedColor = useMemo(
    () => COLORS.find((c) => c.id === color),
    [color]
  );

  const handleQuitarProductoOrigen = () => {
    setProductoOrigen(null);
    // Limpia el state de la navegación para que un refresh no lo vuelva a traer
    navigate(".", { replace: true, state: null });
  };

  const handleGenerate = async () => {
    console.log("🔥 Entró a handleGenerate");

    if (!prompt.trim() || isGenerating) return;

    if (!usuario) {
      setShowAuthGate(true);
      return;
    }

    setIsGenerating(true);
    setErrorGeneracion(null);

    try {
      const promptCompleto = `Producto: ${selectedProduct.name}
Estilo: ${style}
Color: ${selectedColor.label}

${prompt}`;

      const resultado = await generarDiseno({
        prompt: promptCompleto,
        productoId: productoOrigen?.id ?? null,
      });

      console.log("Respuesta:", resultado);

      setImagenGenerada(resultado.imagenUrl ?? resultado.url ?? resultado.imagen ?? null);
      setHasResult(true);
    } catch (error) {
      console.error(error);
      console.error(error.response);
      setErrorGeneracion(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
            ✨ Generador IA
          </span>

          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Crea tu diseño desde cero
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            Describe tu idea, elige el producto y el estilo, y deja que la IA
            haga el resto.
          </p>

          {productoOrigen && (
            <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 py-2 pl-5 pr-2 text-sm text-cyan-300">
              <span>
                Personalizando: <strong>{productoOrigen.nombre}</strong>
              </span>
              <button
                type="button"
                onClick={handleQuitarProductoOrigen}
                aria-label="Quitar producto seleccionado"
                className="rounded-full p-1.5 text-cyan-400 transition hover:bg-cyan-400/20"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Columna de controles */}
          <div className="space-y-8">
            {/* Prompt */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Describe tu diseño
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (showAuthGate) setShowAuthGate(false);
                }}
                placeholder="Quiero una camiseta negra con un dragón japonés en tonos azules y un estilo cyberpunk."
                rows={4}
                className="
                  w-full resize-none rounded-2xl border border-slate-700
                  bg-slate-900 p-5 text-slate-100 placeholder:text-slate-500
                  transition focus:border-cyan-500 focus:outline-none
                  focus:ring-2 focus:ring-cyan-500/30
                "
              />
            </div>

            {/* Producto */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Producto
              </label>
              <div className="grid grid-cols-3 gap-4">
                {PRODUCT_TYPES.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setProductType(product.id)}
                    className={`
                      flex flex-col items-center gap-3 rounded-2xl border p-4
                      transition
                      ${
                        productType === product.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900 hover:border-slate-600"
                      }
                    `}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 object-contain"
                    />
                    <span className="text-sm font-medium">
                      {product.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Estilo */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Estilo
              </label>
              <div className="flex flex-wrap gap-3">
                {STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyle(s)}
                    className={`
                      rounded-full border px-4 py-2 text-sm font-medium
                      transition
                      ${
                        style === s
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                          : "border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                      }
                    `}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Paleta de color
              </label>
              <div className="flex flex-wrap gap-4">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    aria-label={c.label}
                    className={`
                      h-10 w-10 rounded-full bg-gradient-to-br ${c.classes}
                      transition
                      ${
                        color === c.id
                          ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950"
                          : "hover:scale-110"
                      }
                    `}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="
                flex w-full items-center justify-center gap-3 rounded-xl
                bg-gradient-to-r from-cyan-500 to-violet-600
                px-8 py-4 font-semibold
                transition duration-300
                hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]
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

            {errorGeneracion && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-center text-sm text-red-300">
                {errorGeneracion}
              </div>
            )}

            {showAuthGate && (
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 text-center">
                <FaLock className="mx-auto mb-3 text-xl text-cyan-400" />
                <p className="text-slate-200">
                  Inicia sesión o crea una cuenta gratis para generar tu
                  diseño.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to="/login"
                    className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-400"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/registro"
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Columna de vista previa */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-slate-400">Vista previa</span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-cyan-300">
                  {selectedProduct.name} · {style}
                </span>
              </div>

              <div className="relative flex h-80 items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
                {hasResult && imagenGenerada ? (
                  <img
                    src={imagenGenerada}
                    alt="Diseño generado por IA"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-64 object-contain opacity-90"
                    />

                    {/* Overlay mientras se genera o antes de generar */}
                    <div
                      className={`
                        absolute h-28 w-28 rounded-2xl
                        bg-gradient-to-br ${selectedColor.classes}
                        shadow-lg
                        transition-all duration-700
                        ${
                          isGenerating
                            ? "scale-90 opacity-50"
                            : "scale-75 opacity-20"
                        }
                      `}
                    >
                      {isGenerating && (
                        <div className="flex h-full w-full items-center justify-center">
                          <FaSpinner className="animate-spin text-xl text-white" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {hasResult && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-400">
                    ¡Tu diseño está listo! Pronto podrás guardarlo desde tu
                    dashboard.
                  </p>

                  <Link
                    to="/dashboard"
                    className="
                      mt-4 inline-flex items-center gap-3
                      rounded-xl border border-cyan-500
                      px-6 py-3 font-semibold
                      transition duration-300
                      hover:bg-cyan-500 hover:text-slate-950
                    "
                  >
                    Ir a mi dashboard
                    <FaArrowRight />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Generador;