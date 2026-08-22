import { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaSyncAlt,
  FaSave,
  FaShoppingCart,
  FaMagic,
  FaSpinner,
  FaPalette,
  FaTrash,
  FaExpand,
  FaTimes,
} from "react-icons/fa";
import { Shirt, Coffee } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { guardarPersonalizacion } from "../services/personalizacionService";
import { generarDiseno } from "../services/disenoService";
import { getErrorMessage } from "../services/api";
import PrendaMockup, { ANCHO_IMAGEN_BASE } from "../components/ui/PrendaMockup";
import Prenda3D from "../components/ui/Prenda3D";
import { removeBackground } from "@imgly/background-removal";

const COSTO_PERSONALIZACION = 5000;

// Tamaño del lienzo (px) donde se "aplana" el diseño final antes de guardarlo.
const TAMANO_LIENZO = 1000;
// El mockup de referencia mide 500px; el texto y las imágenes se escalan a este
// lienzo más grande para que la imagen guardada se vea nítida.
const FACTOR_LIENZO = TAMANO_LIENZO / 500;

// Categoría del backend -> tipo de mockup interno del personalizador.
const TIPO_POR_CATEGORIA = {
  Camisetas: "camiseta",
  Mugs: "mug",
};

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

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(blob);
  });
}

// Carga una imagen (dataURL o URL remota) como elemento <img> para poder
// dibujarla en el lienzo final. Devuelve null si no se puede cargar.
function cargarImagenElemento(url) {
  return new Promise((resolve) => {
    const img = new Image();
    if (url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
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

  // Producto seleccionado en el personalizador (controla el mockup mostrado).
  // Si el usuario llega desde un producto concreto del catálogo, se preselecciona.
  const [selectedProduct, setSelectedProduct] = useState(
    () => TIPO_POR_CATEGORIA[productoOrigen?.categoria] ?? "camiseta"
  );

  // Lista de imágenes insertadas (subidas o generadas por IA). Cada una guarda
  // su posición (%), rotación (grados) y escala para poder moverla y redimensionarla.
  const [imagenes, setImagenes] = useState([]); // { id, url, x, y, escala, rotacion }
  const [imagenActivaId, setImagenActivaId] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [estiloIA, setEstiloIA] = useState(null); // "caricatura" | "minimalista" | "retro" | "lineas" | null
  const [generandoIA, setGenerandoIA] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(null); // hex
  const [textoDiseno, setTextoDiseno] = useState("");
  const [colorTexto, setColorTexto] = useState("#111111");
  const [tamanoTexto, setTamanoTexto] = useState(32);
  const [posicionTexto, setPosicionTexto] = useState({ x: 50, y: 50 });
  const [rotacionTexto, setRotacionTexto] = useState(0);
  const [escalaTexto, setEscalaTexto] = useState(1);
  const [textoActivo, setTextoActivo] = useState(false);
  const [herramienta, setHerramienta] = useState("imagen"); // "imagen" | "color" | "texto"
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  const [vista3DAbierta, setVista3DAbierta] = useState(false);

  const imagenActiva = imagenes.find((img) => img.id === imagenActivaId) ?? null;

  const hayDiseno = Boolean(
    imagenes.length || colorSeleccionado || textoDiseno.trim()
  );

  const total = useMemo(() => precioBase + COSTO_PERSONALIZACION, [precioBase]);

  const agregarImagen = (url) => {
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Pequeño desplazamiento aleatorio para que al agregar varias no queden
    // exactamente apiladas y sea más fácil separarlas.
    const offset = Math.round((Math.random() - 0.5) * 16);
    const nueva = {
      id,
      url,
      x: 50 + offset,
      y: 45 + offset,
      escala: 1,
      rotacion: 0,
    };
    setImagenes((prev) => [...prev, nueva]);
    setImagenActivaId(id);
    setTextoActivo(false);
  };

  const actualizarImagen = (id, patch) => {
    setImagenes((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  const seleccionarImagen = (id) => {
    setImagenActivaId(id);
    if (id) setTextoActivo(false);
  };

  const seleccionarTexto = () => {
    setImagenActivaId(null);
    setTextoActivo(true);
  };

  const handleTextoTransform = (patch) => {
    if (patch.rotacion !== undefined) setRotacionTexto(patch.rotacion);
    if (patch.escala !== undefined) setEscalaTexto(patch.escala);
  };

  const handleRotarImagen = () => {
    if (!imagenActiva) return;
    actualizarImagen(imagenActiva.id, {
      rotacion: ((imagenActiva.rotacion ?? 0) + 90) % 360,
    });
  };

  const handleEliminarImagen = (id) => {
    setImagenes((prev) => prev.filter((img) => img.id !== id));
    setImagenActivaId((actual) => (actual === id ? null : actual));
  };

  const handleSubirImagen = async (e) => {
    const archivos = Array.from(e.target.files ?? []);
    if (!archivos.length) return;

    setProcesandoImagen(true);
    setMensaje(null);

    // Procesa todas las imágenes seleccionadas, una por una.
    for (const archivo of archivos) {
      try {
        // Quita el fondo automáticamente (persona, animal, objeto) para dejar
        // solo el sujeto. La primera vez descarga el modelo en el navegador.
        const blob = await removeBackground(archivo);
        const dataUrl = await blobToDataURL(blob);
        agregarImagen(dataUrl);
      } catch {
        // Si el recorte falla (sin conexión, navegador sin soporte, etc.),
        // usamos la imagen original tal cual para no bloquear al usuario.
        const lector = new FileReader();
        await new Promise((resolve) => {
          lector.onload = () => {
            agregarImagen(lector.result);
            resolve();
          };
          lector.onerror = () => resolve();
          lector.readAsDataURL(archivo);
        });
      }
    }

    setProcesandoImagen(false);
    // Limpia el input para poder volver a subir el mismo archivo si se quiere.
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerarIA = async () => {
    if (!prompt.trim() || generandoIA) return;

    if (!usuario) {
      navigate("/login");
      return;
    }

    setGenerandoIA(true);
    setMensaje(null);

    try {
      const resultado = await generarDiseno({
        prompt,
        productoId: productoOrigen?.id ?? null,
        estilo: estiloIA,
      });

      const imagenUrl =
        resultado.imagenUrl ?? resultado.url ?? resultado.imagen ?? null;

      if (imagenUrl) {
        // El resultado de IA se agrega como una imagen más, para poder
        // combinarlo con las que ya se hayan subido.
        agregarImagen(imagenUrl);
      } else {
        setMensaje({
          tipo: "error",
          texto: "La IA no pudo generar un diseño. Intenta de nuevo.",
        });
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: getErrorMessage(error) });
    } finally {
      setGenerandoIA(false);
    }
  };

  const handleSeleccionarColor = (color) => {
    setColorSeleccionado(color);
  };

  const handleQuitarDiseno = () => {
    setImagenes([]);
    setImagenActivaId(null);
    setTextoActivo(false);
    setColorSeleccionado(null);
    setTextoDiseno("");
    setColorTexto("#111111");
    setTamanoTexto(32);
    setPosicionTexto({ x: 50, y: 50 });
    setRotacionTexto(0);
    setEscalaTexto(1);
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMensaje(null);
  };

  // Aplana todas las imágenes y el texto en una sola imagen PNG (con fondo
  // transparente) para guardarla como la imagen final de la personalización.
  const componerImagenFinal = async () => {
    if (!imagenes.length && !textoDiseno.trim()) return null;

    const canvas = document.createElement("canvas");
    canvas.width = TAMANO_LIENZO;
    canvas.height = TAMANO_LIENZO;
    const ctx = canvas.getContext("2d");

    for (const imagen of imagenes) {
      const el = await cargarImagenElemento(imagen.url);
      if (!el) continue;

      const baseW = TAMANO_LIENZO * ANCHO_IMAGEN_BASE * (imagen.escala ?? 1);
      const baseH = baseW * (el.naturalHeight / el.naturalWidth);
      const cx = (imagen.x / 100) * TAMANO_LIENZO;
      const cy = (imagen.y / 100) * TAMANO_LIENZO;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((imagen.rotacion ?? 0) * Math.PI) / 180);
      ctx.drawImage(el, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    }

    if (textoDiseno.trim()) {
      ctx.save();
      ctx.translate(
        (posicionTexto.x / 100) * TAMANO_LIENZO,
        (posicionTexto.y / 100) * TAMANO_LIENZO
      );
      ctx.rotate(((rotacionTexto ?? 0) * Math.PI) / 180);
      ctx.scale(escalaTexto ?? 1, escalaTexto ?? 1);
      ctx.fillStyle = colorTexto;
      ctx.font = `600 ${Math.round(tamanoTexto * FACTOR_LIENZO)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textoDiseno, 0, 0);
      ctx.restore();
    }

    return canvas.toDataURL("image/png");
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
      const imagenFinal = await componerImagenFinal();
      const item = await agregarProducto(productoOrigen);

      // Si el carrito devolvió el item, intentamos persistir la
      // personalización asociada (imagen aplanada + descripción).
      if (item?.id) {
        const notas = [
          `Producto: ${selectedProduct === "camiseta" ? "Camiseta" : "Mug"}`,
          imagenes.length ? `Imágenes insertadas: ${imagenes.length}` : null,
          colorSeleccionado ? `Color elegido: ${colorSeleccionado}` : null,
          textoDiseno.trim()
            ? `Texto: "${textoDiseno.trim()}" (${colorTexto}, ${tamanoTexto}px, posición ${Math.round(posicionTexto.x)}%,${Math.round(posicionTexto.y)}%)`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

        await guardarPersonalizacion({
          itemCarritoId: item.id,
          imagenUrl: imagenFinal ?? null,
          texto: notas || null,
          rotacion: null,
          escala: null,
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
    <>
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

        {/* Selector de producto */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-slate-400">
            Elige el producto
          </p>
          <div className="grid max-w-md grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedProduct("camiseta")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                selectedProduct === "camiseta"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/40"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <Shirt className="h-8 w-8" />
              <span className="font-semibold">Camiseta</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProduct("mug")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                selectedProduct === "mug"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/40"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <Coffee className="h-8 w-8" />
              <span className="font-semibold">Mug</span>
            </button>
          </div>
        </div>

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
                {/* Subir imagen (varias a la vez) */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Subir imágenes
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={procesandoImagen}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                >
                  {procesandoImagen ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Procesando... (la primera vez tarda un poco)
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Click para subir (puedes elegir varias)
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSubirImagen}
                  className="hidden"
                />

                <div className="my-5 border-t border-gray-200 dark:border-slate-800" />

                {/* Generar con IA — justo debajo de Subir imagen */}
                <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <FaMagic className="text-indigo-500 dark:text-cyan-400" />
                  Generar con IA
                </p>

                {/* Selector de estilo */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[
                    { id: "caricatura", label: "Caricatura" },
                    { id: "minimalista", label: "Minimalista" },
                    { id: "retro", label: "Retro" },
                    { id: "lineas", label: "Línea simple" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() =>
                        setEstiloIA((actual) => (actual === op.id ? null : op.id))
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        estiloIA === op.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                          : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

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

                {/* Gestión de las imágenes insertadas */}
                {imagenes.length > 0 && (
                  <>
                    <div className="my-5 border-t border-gray-200 dark:border-slate-800" />

                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                      Imágenes ({imagenes.length})
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {imagenes.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setImagenActivaId(img.id)}
                          title="Seleccionar imagen"
                          className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 bg-gray-50 transition dark:bg-slate-800 ${
                            img.id === imagenActivaId
                              ? "border-indigo-500 dark:border-cyan-400"
                              : "border-gray-200 hover:border-indigo-300 dark:border-slate-700"
                          }`}
                        >
                          <img src={img.url} alt="Miniatura" className="max-h-full max-w-full object-contain" />
                        </button>
                      ))}
                    </div>

                    {imagenActiva && (
                      <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          Imagen seleccionada
                        </p>

                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                          Tamaño: {Math.round((imagenActiva.escala ?? 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0.2}
                          max={3}
                          step={0.05}
                          value={imagenActiva.escala ?? 1}
                          onChange={(e) =>
                            actualizarImagen(imagenActiva.id, {
                              escala: Number(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-600 dark:accent-cyan-500"
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleRotarImagen}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
                          >
                            <FaSyncAlt /> Rotar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarImagen(imagenActiva.id)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-red-500 transition hover:border-red-300 dark:border-slate-700 dark:text-red-400 dark:hover:border-red-500/50"
                          >
                            <FaTrash /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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

                <button
                  type="button"
                  onClick={() => setRotacionTexto((r) => (r + 90) % 360)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
                >
                  <FaSyncAlt /> Rotar texto
                </button>

                <label className="mb-2 mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Escala: {Math.round(escalaTexto * 100)}%
                </label>
                <input
                  type="range"
                  min={0.2}
                  max={3}
                  step={0.05}
                  value={escalaTexto}
                  onChange={(e) => setEscalaTexto(Number(e.target.value))}
                  className="w-full accent-indigo-600 dark:accent-cyan-500"
                />
              </>
            )}

            {herramienta !== "imagen" && (
              <p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
                Consejo: arrastra el texto o las imágenes sobre la prenda para
                moverlos, y usa las esquinas del elemento seleccionado para
                redimensionar o rotar.
              </p>
            )}
          </div>

          {/* Zona de diseño (mockup del producto seleccionado) */}
          <div className="relative flex min-h-[420px] flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900">
            {hayDiseno && (
              <button
                type="button"
                onClick={handleQuitarDiseno}
                aria-label="Quitar diseño"
                className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
              >
                <FaTrash /> Quitar diseño
              </button>
            )}

            <div className="w-full max-w-[500px] p-2">
              <PrendaMockup
                tipo={selectedProduct}
                color={colorSeleccionado}
                imagenes={imagenes}
                imagenActivaId={imagenActivaId}
                onImagenChange={actualizarImagen}
                onSeleccionarImagen={seleccionarImagen}
                texto={textoDiseno}
                colorTexto={colorTexto}
                tamanoTexto={tamanoTexto}
                posicionTexto={posicionTexto}
                onPosicionTextoChange={setPosicionTexto}
                rotacionTexto={rotacionTexto}
                escalaTexto={escalaTexto}
                onTextoTransformChange={handleTextoTransform}
                textoActivo={textoActivo}
                onSeleccionarTexto={seleccionarTexto}
              />
            </div>
          </div>

          {/* Vista previa */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:w-[300px] lg:shrink-0">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
              Vista previa
            </h2>

            <div className="mb-4 flex items-center justify-center overflow-hidden rounded-xl bg-gray-100 p-4 dark:bg-slate-800">
              <div className="relative h-64 w-full" style={{ aspectRatio: "220 / 260" }}>
                <Prenda3D
                  key={selectedProduct}
                  tipo={selectedProduct}
                  color={colorSeleccionado ?? "#ffffff"}
                  imagenes={imagenes}
                  texto={textoDiseno}
                  colorTexto={colorTexto}
                  tamanoTexto={tamanoTexto}
                  posicionTexto={posicionTexto}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVista3DAbierta(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300 py-2.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:border-cyan-500/40 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
            >
              <FaExpand /> Ver en 3D a pantalla completa
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

      {vista3DAbierta && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-bold text-white">Vista 3D</h2>
            <button
              type="button"
              onClick={() => setVista3DAbierta(false)}
              aria-label="Cerrar vista 3D"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-2">
            <div className="aspect-square w-full max-w-[560px]">
              <Prenda3D
                key={`modal-${selectedProduct}`}
                tipo={selectedProduct}
                color={colorSeleccionado ?? "#ffffff"}
                imagenes={imagenes}
                texto={textoDiseno}
                colorTexto={colorTexto}
                tamanoTexto={tamanoTexto}
                posicionTexto={posicionTexto}
              />
            </div>
          </div>

          <p className="pb-6 text-center text-sm text-slate-400">
            Arrastra para rotar · Usa la rueda para acercar o alejar
          </p>
        </div>
      )}
    </>
  );
}

export default Personalizador;
