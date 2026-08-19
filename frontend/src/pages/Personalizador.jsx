import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaSyncAlt,
  FaSearchPlus,
  FaEye,
  FaSave,
  FaShoppingCart,
  FaMagic,
  FaSpinner,
  FaPalette,
  FaTrash,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { guardarPersonalizacion } from "../services/personalizacionService";

const COSTO_PERSONALIZACION = 5000;

// Paletas simuladas para el resultado "generado por IA" — hasta que se
// conecte un proveedor real (OpenAI Images, Stability, etc.) esto es
// solo una representación visual del resultado.
const PALETAS_IA = [
  "from-cyan-500 via-slate-700 to-violet-600",
  "from-pink-500 via-slate-700 to-rose-600",
  "from-emerald-500 via-slate-700 to-teal-600",
  "from-amber-500 via-slate-700 to-orange-600",
];

// Paleta amplia de colores preseleccionables para pintar el diseño/objeto.
const PALETA_COLORES = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E",
  "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
  "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#78350F",
  "#78716C", "#57534E", "#44403C", "#292524", "#1C1917", "#000000",
  "#FFFFFF", "#F5F5F4", "#D6D3D1", "#A8A29E", "#FDE68A", "#FCA5A5",
  "#BBF7D0", "#BFDBFE",
];

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function Personalizador() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { agregarProducto } = useCart();
  const fileInputRef = useRef(null);

  // Producto elegido en Catálogo / Detalle (si existe); si se entra
  // directo a la página, se usa un producto de referencia genérico.
  const productoOrigen = location.state ?? null;
  const precioBase = productoOrigen?.precio ?? 25000;

  const [imagenSubida, setImagenSubida] = useState(null); // dataURL
  const [prompt, setPrompt] = useState("");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null); // clase de gradiente
  const [colorSeleccionado, setColorSeleccionado] = useState(null); // hex
  const [textoDiseno, setTextoDiseno] = useState("");
  const [colorTexto, setColorTexto] = useState("#111111");
  const [tamanoTexto, setTamanoTexto] = useState(32);
  const [herramienta, setHerramienta] = useState("imagen"); // "imagen" | "color" | "texto"
  const [rotacion, setRotacion] = useState(0);
  const [escala, setEscala] = useState(1);
  const [mostrarVistaPrevia3D, setMostrarVistaPrevia3D] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const hayDiseno = Boolean(
    imagenSubida || resultadoIA || colorSeleccionado || textoDiseno.trim()
  );

  const total = useMemo(() => precioBase + COSTO_PERSONALIZACION, [precioBase]);

  const handleSubirImagen = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = () => {
      setImagenSubida(lector.result);
      setResultadoIA(null); // la imagen subida reemplaza cualquier resultado de IA
      setRotacion(0);
      setEscala(1);
    };
    lector.readAsDataURL(archivo);
  };

  const handleGenerarIA = () => {
    if (!prompt.trim() || generandoIA) return;

    setGenerandoIA(true);
    setMensaje(null);

    // Simulación — reemplazar por la llamada real a un proveedor de
    // generación de imágenes (requiere backend + API key propia).
    setTimeout(() => {
      const paleta = PALETAS_IA[Math.floor(Math.random() * PALETAS_IA.length)];
      setResultadoIA(paleta);
      setImagenSubida(null); // el resultado de IA reemplaza cualquier imagen subida
      setRotacion(0);
      setEscala(1);
      setGenerandoIA(false);
    }, 1600);
  };

  const handleRotar = () => {
    if (!hayDiseno) return;
    setRotacion((prev) => (prev + 90) % 360);
  };

  const handleEscalar = () => {
    if (!hayDiseno) return;
    setEscala((prev) => (prev >= 1.4 ? 0.8 : prev + 0.2));
  };

  const handleSeleccionarColor = (color) => {
    setColorSeleccionado(color);
  };

  const handleQuitarDiseno = () => {
    setImagenSubida(null);
    setResultadoIA(null);
    setColorSeleccionado(null);
    setTextoDiseno("");
    setColorTexto("#111111");
    setTamanoTexto(32);
    setRotacion(0);
    setEscala(1);
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMensaje(null);
  };

  const handleGuardarDiseno = async () => {
    if (!hayDiseno) {
      setMensaje({ tipo: "error", texto: "Sube una imagen o genera un diseño con IA primero." });
      return;
    }
    setMensaje({ tipo: "ok", texto: "Diseño guardado en esta sesión." });
  };

  const handleAgregarAlCarrito = async () => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (!productoOrigen) {
      setMensaje({
        tipo: "error",
        texto: "Elige un producto desde el catálogo antes de personalizar.",
      });
      return;
    }
    if (!hayDiseno) {
      setMensaje({ tipo: "error", texto: "Sube una imagen o genera un diseño con IA primero." });
      return;
    }

    setGuardando(true);
    setMensaje(null);
    try {
      const item = await agregarProducto(productoOrigen);

      // Si el carrito devolvió el item, intentamos persistir la
      // personalización asociada (imagen, rotación, escala, costo extra).
      if (item?.id) {
        const notas = [
          resultadoIA ? `Generado por IA: ${prompt}` : null,
          colorSeleccionado ? `Color elegido: ${colorSeleccionado}` : null,
          textoDiseno.trim() ? `Texto: "${textoDiseno.trim()}" (${colorTexto}, ${tamanoTexto}px)` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        await guardarPersonalizacion({
          itemCarritoId: item.id,
          imagenUrl: imagenSubida ?? null,
          texto: notas || null,
          rotacion,
          escala,
          costoAdicional: COSTO_PERSONALIZACION,
        }).catch(() => {
          // No bloquea el flujo si la personalización no se pudo guardar;
          // el producto ya quedó en el carrito.
        });
      }

      setMensaje({ tipo: "ok", texto: "Producto personalizado agregado al carrito." });
    } catch {
      setMensaje({ tipo: "error", texto: "No fue posible agregar el producto al carrito." });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Personaliza tu producto
        </h1>

        {productoOrigen && (
          <p className="-mt-6 mb-6 text-sm text-gray-500 dark:text-slate-400">
            Personalizando: <strong>{productoOrigen.nombre}</strong>
          </p>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Herramientas */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:w-[280px] lg:shrink-0">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
              Herramientas
            </h2>

            {/* Tira de pestañas: imagen / texto / color */}
            <div className="mb-4 flex items-center gap-1 rounded-xl border border-gray-200 p-1 dark:border-slate-700">
              <button
                type="button"
                aria-label="Herramienta de imagen"
                onClick={() => setHerramienta("imagen")}
                className={`flex flex-1 items-center justify-center rounded-lg py-2 transition ${
                  herramienta === "imagen"
                    ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                    : "text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                }`}
              >
                <FaUpload className="text-sm" />
              </button>
              <button
                type="button"
                aria-label="Herramienta de texto"
                onClick={() => setHerramienta("texto")}
                className={`flex flex-1 items-center justify-center rounded-lg py-2 transition ${
                  herramienta === "texto"
                    ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                    : "text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                }`}
              >
                <span className="text-sm font-bold">T</span>
              </button>
              <button
                type="button"
                aria-label="Herramienta de color"
                onClick={() => setHerramienta("color")}
                className={`flex flex-1 items-center justify-center rounded-lg py-2 transition ${
                  herramienta === "color"
                    ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                    : "text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                }`}
              >
                <FaPalette className="text-sm" />
              </button>
            </div>

            {herramienta === "imagen" ? (
              <>
                {/* Subir imagen */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Subir imagen
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                >
                  <FaUpload />
                  Click para subir o arrastra aquí
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSubirImagen}
                  className="hidden"
                />

                <div className="my-5 border-t border-gray-200 dark:border-slate-800" />

                {/* Generar con IA — justo debajo de Subir imagen */}
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <FaMagic className="text-indigo-500 dark:text-cyan-400" />
                  Generar con IA
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: un dragón japonés minimalista en tonos azules"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleGenerarIA}
                  disabled={!prompt.trim() || generandoIA}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                >
                  {generandoIA ? (
                    <>
                      <FaSpinner className="animate-spin" /> Generando...
                    </>
                  ) : (
                    <>
                      <FaMagic /> Generar
                    </>
                  )}
                </button>
              </>
            ) : herramienta === "color" ? (
              <>
                {/* Paleta de colores */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Elige un color
                </p>

                <div className="mb-4 grid grid-cols-8 gap-2">
                  {PALETA_COLORES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleSeleccionarColor(color)}
                      aria-label={`Color ${color}`}
                      style={{ backgroundColor: color }}
                      className={`h-7 w-7 rounded-md border transition hover:scale-110 ${
                        colorSeleccionado === color
                          ? "border-indigo-500 ring-2 ring-indigo-300 dark:border-cyan-400 dark:ring-cyan-500/40"
                          : "border-gray-200 dark:border-slate-700"
                      }`}
                    />
                  ))}
                </div>

                {/* Selector libre: cualquier color posible */}
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  O elige cualquier color
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-2 dark:border-slate-700">
                  <input
                    type="color"
                    value={colorSeleccionado ?? "#6366F1"}
                    onChange={(e) => handleSeleccionarColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    {colorSeleccionado ?? "Ningún color elegido"}
                  </span>
                </div>
              </>
            ) : (
              <>
                {/* Texto sobre el diseño */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Agregar texto
                </p>
                <input
                  type="text"
                  value={textoDiseno}
                  onChange={(e) => setTextoDiseno(e.target.value)}
                  placeholder="Ej: Familia Pérez"
                  maxLength={40}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                />

                <label className="mb-2 mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Color del texto
                </label>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 p-2 dark:border-slate-700">
                  <input
                    type="color"
                    value={colorTexto}
                    onChange={(e) => setColorTexto(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400">{colorTexto}</span>
                </div>

                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Tamaño: {tamanoTexto}px
                </label>
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={2}
                  value={tamanoTexto}
                  onChange={(e) => setTamanoTexto(Number(e.target.value))}
                  className="w-full accent-indigo-600 dark:accent-cyan-500"
                />
              </>
            )}

            <div className="my-5 border-t border-gray-200 dark:border-slate-800" />

            <button
              type="button"
              onClick={handleRotar}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              <FaSyncAlt /> Rotar
            </button>
            <button
              type="button"
              onClick={handleEscalar}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              <FaSearchPlus /> Escalar
            </button>
          </div>

          {/* Zona de diseño */}
          <div className="relative flex min-h-[420px] flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900">
            {hayDiseno && (
              <button
                type="button"
                onClick={handleQuitarDiseno}
                aria-label="Quitar diseño"
                className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
              >
                <FaTrash /> Quitar diseño
              </button>
            )}

            {imagenSubida ? (
              <div
                className="relative max-h-[380px] max-w-[80%] transition-transform duration-300"
                style={{ transform: `rotate(${rotacion}deg) scale(${escala})` }}
              >
                <img
                  src={imagenSubida}
                  alt="Diseño subido"
                  className="max-h-[380px] max-w-full object-contain"
                />
                {colorSeleccionado && (
                  <div
                    className="absolute inset-0 mix-blend-multiply"
                    style={{ backgroundColor: colorSeleccionado, opacity: 0.55 }}
                  />
                )}
              </div>
            ) : resultadoIA && !colorSeleccionado ? (
              <div
                className={`h-64 w-64 rounded-2xl bg-gradient-to-br ${resultadoIA} shadow-lg transition-transform duration-300`}
                style={{ transform: `rotate(${rotacion}deg) scale(${escala})` }}
              />
            ) : colorSeleccionado ? (
              <div
                className="h-64 w-64 rounded-2xl shadow-lg transition-transform duration-300"
                style={{
                  backgroundColor: colorSeleccionado,
                  transform: `rotate(${rotacion}deg) scale(${escala})`,
                }}
              />
            ) : !hayDiseno ? (
              <span className="text-gray-400 dark:text-slate-500">Zona de diseño</span>
            ) : null}

            {textoDiseno.trim() && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                <p
                  className="text-center font-semibold"
                  style={{
                    color: colorTexto,
                    fontSize: `${tamanoTexto}px`,
                    transform: `rotate(${rotacion}deg) scale(${escala})`,
                  }}
                >
                  {textoDiseno}
                </p>
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:w-[300px] lg:shrink-0">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
              Vista previa
            </h2>

            <div className="flex h-32 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400 dark:bg-slate-800 dark:text-slate-500">
              Vista previa 3D
            </div>

            <button
              type="button"
              onClick={() => setMostrarVistaPrevia3D((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              <FaEye /> Vista previa 3D
            </button>

            <button
              type="button"
              onClick={handleGuardarDiseno}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              <FaSave /> Guardar diseño
            </button>

            <button
              type="button"
              onClick={handleAgregarAlCarrito}
              disabled={guardando}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              <FaShoppingCart /> {guardando ? "Agregando..." : "Añadir al carrito"}
            </button>

            {mensaje && (
              <p
                className={`mt-3 text-center text-xs ${
                  mensaje.tipo === "error"
                    ? "text-red-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {mensaje.texto}
              </p>
            )}

            <div className="mt-5 space-y-1 border-t border-gray-200 pt-4 text-sm dark:border-slate-800">
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Producto base</span>
                <span>{formatPrice(precioBase)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Personalización</span>
                <span>{formatPrice(COSTO_PERSONALIZACION)}</span>
              </div>
            </div>

            <div className="mt-2 flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900 dark:border-slate-800 dark:text-white">
              <span>Total</span>
              <span className="text-indigo-600 dark:text-cyan-400">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Personalizador;
