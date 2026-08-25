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
  FaCompress,
  FaMinus,
  FaPlus,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Shirt, Coffee } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { guardarPersonalizacion } from "../services/personalizacionService";
import { generarDiseno, subirDiseno } from "../services/disenoService";
import { getErrorMessage } from "../services/api";
import PrendaMockup, {
  ANCHO_IMAGEN_BASE,
  ESCALA_MIN,
  ESCALA_MAX,
} from "../components/ui/PrendaMockup";
import Prenda3D from "../components/ui/Prenda3D";
import { removeBackground } from "@imgly/background-removal";
import procesarDiseno from "../utils/quitarFondoBlanco";
import {
  FUENTES_TEXTO,
  FUENTE_TEXTO_DEFECTO,
  CATEGORIAS_FUENTE,
  buscarFuente,
  cargarFuenteParaCanvas,
} from "../utils/fuentesTexto";

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

// Superficies donde se puede ubicar un estampado en la camiseta. Cada imagen
// guarda su posición libre {x, y} (%) DENTRO de la superficie elegida.
const CARAS_CAMISETA = [
  { id: "frente", label: "Frente" },
  { id: "espalda", label: "Espalda" },
  { id: "mangaIzquierda", label: "Manga izq." },
  { id: "mangaDerecha", label: "Manga der." },
];

// Ubicaciones del pocillo: de frente y desde atrás (donde se ve el asa).
const CARAS_MUG = [
  { id: "frente", label: "Frente" },
  { id: "atras", label: "Atrás" },
];

const CARAS_POR_TIPO = {
  camiseta: CARAS_CAMISETA,
  mug: CARAS_MUG,
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

// Convierte un dataURL (PNG/JPEG) en un File, listo para subir con FormData.
function dataUrlToFile(dataUrl, nombre) {
  const coma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(0, coma);
  const base64 = dataUrl.slice(coma + 1);
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new File([bytes], nombre, { type: mime });
}

// Ancho real (pulgadas) que representa el lienzo al imprimir. Sirve para
// estimar el DPI efectivo de cada imagen una vez escalada.
const PRINT_WIDTH_INCHES = 12;
const DPI_MINIMO = 150;

function calcularDpi(naturalWidth, anchoRenderizadoPx) {
  if (!naturalWidth || !anchoRenderizadoPx) return 0;
  const pulgadas = (anchoRenderizadoPx / TAMANO_LIENZO) * PRINT_WIDTH_INCHES;
  return pulgadas > 0 ? naturalWidth / pulgadas : 0;
}

// DPI efectivo de una imagen ya colocada en el lienzo, con su escala actual.
function dpiDeImagen(img) {
  const ancho =
    TAMANO_LIENZO * ANCHO_IMAGEN_BASE * (img.escalaX ?? img.escala ?? 1);
  return calcularDpi(img.naturalWidth, ancho);
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
  // la cara/superficie de la prenda, su posición (%), rotación (grados) y
  // escala para poder arrastrarla y redimensionarla libremente.
  const [imagenes, setImagenes] = useState([]); // { id, url, cara, x, y, escala, rotacion }
  const [imagenActivaId, setImagenActivaId] = useState(null);
  const [caraActiva, setCaraActiva] = useState("frente");

  const [prompt, setPrompt] = useState("");
  const [estiloIA, setEstiloIA] = useState(null); // "caricatura" | "minimalista" | "retro" | "lineas" | null
  const [generandoIA, setGenerandoIA] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(null); // hex
  const [textoDiseno, setTextoDiseno] = useState("");
  const [colorTexto, setColorTexto] = useState("#111111");
  const [fuenteTexto, setFuenteTexto] = useState(FUENTE_TEXTO_DEFECTO);
  const [filtroFuente, setFiltroFuente] = useState("todas");
  const [tamanoTexto, setTamanoTexto] = useState(32);
  const [posicionTexto, setPosicionTexto] = useState({ x: 50, y: 50 });
  const [rotacionTexto, setRotacionTexto] = useState(0);
  const [escalaTexto, setEscalaTexto] = useState(1);
  const [textoActivo, setTextoActivo] = useState(false);
  const [herramienta, setHerramienta] = useState("imagen"); // "imagen" | "color" | "texto"
  const [guardando, setGuardando] = useState(false);
  const [guardandoDiseno, setGuardandoDiseno] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [procesandoImagen, setProcesandoImagen] = useState(false);
  // Recorte inteligente de fondo al subir imágenes (@imgly): activado por
  // defecto; el usuario puede apagarlo para subir la imagen tal cual, con su
  // fondo original.
  const [recorteInteligente, setRecorteInteligente] = useState(true);
  const [vista3DAbierta, setVista3DAbierta] = useState(false);
  // Zoom del lienzo de edición (0.5x - 3x) y modo pantalla completa del mismo.
  const [zoomLienzo, setZoomLienzo] = useState(1);
  const [lienzoMaximizado, setLienzoMaximizado] = useState(false);

  const imagenActiva = imagenes.find((img) => img.id === imagenActivaId) ?? null;

  // DPI estimado de la imagen seleccionada (para avisar si quedará pixelada).
  const dpiImagenActiva = imagenActiva ? dpiDeImagen(imagenActiva) : 0;
  const imagenActivaBajaCalidad =
    imagenActiva != null &&
    imagenActiva.naturalWidth > 0 &&
    dpiImagenActiva < DPI_MINIMO;
  const hayImagenesBajaCalidad = imagenes.some(
    (img) => img.naturalWidth > 0 && dpiDeImagen(img) < DPI_MINIMO
  );

  const caraDe = (img) => img.cara ?? "frente";
  // Imágenes de la cara activa (las que se editan en el mockup grande).
  const imagenesEnCaraActiva = imagenes.filter(
    (img) => caraDe(img) === caraActiva
  );

  const hayDiseno = Boolean(
    imagenes.length || colorSeleccionado || textoDiseno.trim()
  );

  const total = useMemo(() => precioBase + COSTO_PERSONALIZACION, [precioBase]);

  // Fuentes del menú, filtradas por la categoría elegida.
  const fuentesVisibles = useMemo(
    () =>
      filtroFuente === "todas"
        ? FUENTES_TEXTO
        : FUENTES_TEXTO.filter((f) => f.categoria === filtroFuente),
    [filtroFuente]
  );

  const agregarImagen = async (url) => {
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Pequeño desplazamiento aleatorio para que al agregar varias no queden
    // exactamente apiladas y sea más fácil separarlas.
    const offset = Math.round((Math.random() - 0.5) * 16);

    // Dimensiones originales de la imagen, para poder estimar el DPI al
    // escalarla y avisar si quedará pixelada al imprimir.
    let naturalWidth = 0;
    let naturalHeight = 0;
    try {
      const el = await cargarImagenElemento(url);
      if (el) {
        naturalWidth = el.naturalWidth;
        naturalHeight = el.naturalHeight;
      }
    } catch {
      // Sin dimensiones: se trata como desconocidas y no se muestra aviso.
    }

    const nueva = {
      id,
      url,
      cara: caraActiva,
      x: 50 + offset,
      y: 45 + offset,
      escalaX: 1,
      escalaY: 1,
      rotacion: 0,
      naturalWidth,
      naturalHeight,
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
        let dataUrl;
        if (recorteInteligente) {
          // Quita el fondo automáticamente (persona, animal, objeto) para
          // dejar solo el sujeto. La primera vez descarga el modelo en el
          // navegador.
          const blob = await removeBackground(archivo);
          dataUrl = await blobToDataURL(blob);
        } else {
          // Recorte apagado: la imagen se sube tal cual, con su fondo.
          dataUrl = await blobToDataURL(archivo);
        }
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
    setFuenteTexto(FUENTE_TEXTO_DEFECTO);
    setTamanoTexto(32);
    setPosicionTexto({ x: 50, y: 50 });
    setRotacionTexto(0);
    setEscalaTexto(1);
    setPrompt("");
    setCaraActiva("frente");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMensaje(null);
  };

  // Aplana todas las imágenes y el texto en una sola imagen PNG (con fondo
  // transparente) para guardarla como la imagen final de la personalización.
  // La posición de cada elemento es libre ({x, y} en %), la misma que usa el
  // editor de "Ajuste fino" con react-moveable.
  const componerImagenFinal = async () => {
    if (!imagenes.length && !textoDiseno.trim()) return null;

    const canvas = document.createElement("canvas");
    canvas.width = TAMANO_LIENZO;
    canvas.height = TAMANO_LIENZO;
    const ctx = canvas.getContext("2d");

      for (const imagen of imagenes) {
        // Mismo procesamiento que el editor 2D y la textura 3D: sin esto, la
        // imagen guardada conservaría el fondo blanco que en pantalla no se ve.
        const procesada = await procesarDiseno(imagen.url);
        const el = await cargarImagenElemento(procesada?.dataUrl ?? imagen.url);
        if (!el) continue;

        const baseW =
          TAMANO_LIENZO *
          ANCHO_IMAGEN_BASE *
          (imagen.escalaX ?? imagen.escala ?? 1);
        const baseH =
          baseW *
          (el.naturalHeight / el.naturalWidth) *
          (imagen.escalaY ?? imagen.escala ?? 1);
        const cx = (imagen.x / 100) * TAMANO_LIENZO;
        const cy = (imagen.y / 100) * TAMANO_LIENZO;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(((imagen.rotacion ?? 0) * Math.PI) / 180);
        ctx.drawImage(el, -baseW / 2, -baseH / 2, baseW, baseH);
        ctx.restore();
      }

    if (textoDiseno.trim()) {
      // Asegura que la fuente web esté descargada antes de dibujar; si no,
      // el canvas caería al fallback y la imagen guardada no coincidiría.
      await cargarFuenteParaCanvas(fuenteTexto);
      ctx.save();
      ctx.translate(
        (posicionTexto.x / 100) * TAMANO_LIENZO,
        (posicionTexto.y / 100) * TAMANO_LIENZO
      );
      ctx.rotate(((rotacionTexto ?? 0) * Math.PI) / 180);
      ctx.scale(escalaTexto ?? 1, escalaTexto ?? 1);
      ctx.fillStyle = colorTexto;
      ctx.font = `600 ${Math.round(tamanoTexto * FACTOR_LIENZO)}px ${fuenteTexto}`;
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
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (!productoOrigen) {
      setMensaje({ tipo: "error", texto: "Elige un producto desde el catálogo antes de guardar." });
      return;
    }

    setGuardandoDiseno(true);
    setMensaje(null);
    try {
      const dataUrl = await componerImagenFinal();
      if (!dataUrl) {
        setMensaje({ tipo: "error", texto: "No se pudo generar la imagen del diseño." });
        return;
      }
      const file = dataUrlToFile(dataUrl, "diseno.png");
      await subirDiseno({ file, productoId: productoOrigen.id });
      setMensaje({ tipo: "ok", texto: "Diseño guardado. Lo encontrarás en tu dashboard." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setGuardandoDiseno(false);
    }
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
            ? `Texto: "${textoDiseno.trim()}" (${colorTexto}, ${tamanoTexto}px, fuente ${buscarFuente(fuenteTexto)?.nombre ?? "Clásica"}, posición ${Math.round(posicionTexto.x)}%,${Math.round(posicionTexto.y)}%)`
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

  // Lienzo de edición: se reutiliza en el panel central y en el modo
  // maximizado (pantalla completa del editor 2D).
  const lienzoMockup = (
    <PrendaMockup
      tipo={selectedProduct}
      cara={caraActiva}
      color={colorSeleccionado}
      imagenes={imagenesEnCaraActiva}
      imagenActivaId={imagenActivaId}
      onImagenChange={actualizarImagen}
      onSeleccionarImagen={seleccionarImagen}
      texto={caraActiva === "frente" ? textoDiseno : ""}
      colorTexto={colorTexto}
      fuenteTexto={fuenteTexto}
      tamanoTexto={tamanoTexto}
      posicionTexto={posicionTexto}
      onPosicionTextoChange={setPosicionTexto}
      rotacionTexto={rotacionTexto}
      escalaTexto={escalaTexto}
      onTextoTransformChange={handleTextoTransform}
      textoActivo={textoActivo && caraActiva === "frente"}
      onSeleccionarTexto={seleccionarTexto}
    />
  );

  // Controles de zoom (+/-) y maximizar/minimizar del lienzo.
  const controlZoom = (
    <div className="flex items-center gap-1 rounded-xl border border-gray-300 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-900">
      <button
        type="button"
        onClick={() =>
          setZoomLienzo((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))
        }
        aria-label="Alejar el lienzo"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <FaMinus className="text-xs" />
      </button>
      <span className="w-12 text-center text-xs font-semibold text-gray-600 dark:text-slate-300">
        {Math.round(zoomLienzo * 100)}%
      </span>
      <button
        type="button"
        onClick={() =>
          setZoomLienzo((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))
        }
        aria-label="Acercar el lienzo"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <FaPlus className="text-xs" />
      </button>
      <button
        type="button"
        onClick={() => setLienzoMaximizado((m) => !m)}
        aria-label={
          lienzoMaximizado ? "Minimizar el lienzo" : "Maximizar el lienzo"
        }
        title={
          lienzoMaximizado ? "Minimizar el lienzo" : "Maximizar el lienzo"
        }
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border-l border-gray-200 pl-1 text-gray-600 transition hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {lienzoMaximizado ? <FaCompress /> : <FaExpand />}
      </button>
    </div>
  );

  const carasProducto = CARAS_POR_TIPO[selectedProduct] ?? CARAS_CAMISETA;

  const etiquetaCaraActiva =
    carasProducto.find((cara) => cara.id === caraActiva)?.label ?? "";

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
              onClick={() => {
                setSelectedProduct("camiseta");
                setCaraActiva("frente");
              }}
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
              onClick={() => {
                setSelectedProduct("mug");
                setCaraActiva("frente");
              }}
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
                {/* Ubicación del estampado. La posición dentro de cada
                    ubicación es libre, arrastrando en el mockup grande. */}
                <>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                    Ubicación del diseño
                  </p>
                  <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-gray-200 p-1 dark:border-slate-700">
                    {carasProducto.map((cara) => (
                      <button
                        key={cara.id}
                        type="button"
                        onClick={() => setCaraActiva(cara.id)}
                        className={`rounded-lg py-2 text-xs font-semibold transition ${
                          caraActiva === cara.id
                            ? "bg-indigo-600 text-white dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                            : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        {cara.label}
                      </button>
                    ))}
                  </div>
                </>

                {/* Subir imagen (varias a la vez) */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Subir imágenes
                </p>

                {/* Interruptor: recorte inteligente de fondo al subir */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={recorteInteligente}
                  onClick={() => setRecorteInteligente((v) => !v)}
                  className="mb-2 flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400"
                >
                  <span>Recortar fondo inteligente</span>
                  <span
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      recorteInteligente
                        ? "bg-indigo-600 dark:bg-cyan-500"
                        : "bg-gray-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                        recorteInteligente ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>

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

                    <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                      Imágenes ({imagenes.length})
                      {hayImagenesBajaCalidad && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                          title={`Algunas imágenes están por debajo de ${DPI_MINIMO} DPI para impresión`}
                        >
                          <FaExclamationTriangle /> baja calidad
                        </span>
                      )}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {imagenes.map((img) => {
                        const etiquetaCara = carasProducto.find(
                          (cara) => cara.id === caraDe(img)
                        )?.label;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              setImagenActivaId(img.id);
                              setCaraActiva(caraDe(img));
                            }}
                            title={`Ubicación: ${etiquetaCara ?? "Frente"}`}
                            className={`relative flex h-16 w-14 flex-col items-center justify-center overflow-hidden rounded-lg border-2 bg-gray-50 transition dark:bg-slate-800 ${
                              img.id === imagenActivaId
                                ? "border-indigo-500 dark:border-cyan-400"
                                : "border-gray-200 hover:border-indigo-300 dark:border-slate-700"
                            }`}
                          >
                            <img src={img.url} alt="Miniatura" className="max-h-10 max-w-full object-contain" />
                            <span className="w-full truncate px-0.5 text-center text-[9px] text-gray-400 dark:text-slate-500">
                              {etiquetaCara ?? "Frente"}
                            </span>
                            {img.naturalWidth > 0 &&
                              dpiDeImagen(img) < DPI_MINIMO && (
                                <FaExclamationTriangle className="absolute right-0.5 top-0.5 text-[10px] text-amber-500" />
                              )}
                          </button>
                        );
                      })}
                    </div>

                    {imagenActiva && (
                      <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          Imagen seleccionada
                        </p>

                        {imagenActivaBajaCalidad && (
                          <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                            <FaExclamationTriangle className="mt-0.5 shrink-0" />
                            Imagen pequeña para imprimir (≈
                            {Math.round(dpiImagenActiva)} DPI, mínimo {DPI_MINIMO}).
                            Usa una de mayor resolución o redúcela de tamaño.
                          </p>
                        )}

                        <>
                          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                            Ubicación
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            {carasProducto.map((cara) => (
                              <button
                                key={cara.id}
                                type="button"
                                onClick={() => {
                                  actualizarImagen(imagenActiva.id, { cara: cara.id });
                                  setCaraActiva(cara.id);
                                }}
                                className={`rounded-lg border py-1.5 text-[10px] font-semibold transition ${
                                  caraDe(imagenActiva) === cara.id
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                                    : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400"
                                }`}
                              >
                                {cara.label}
                              </button>
                            ))}
                          </div>
                        </>

                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                          Tamaño:{" "}
                          {Math.round(
                            (imagenActiva.escalaX ?? imagenActiva.escala ?? 1) *
                              100
                          )}
                          %
                        </label>
                        <input
                          type="range"
                          min={ESCALA_MIN}
                          max={ESCALA_MAX}
                          step={0.05}
                          value={
                            imagenActiva.escalaX ?? imagenActiva.escala ?? 1
                          }
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            actualizarImagen(imagenActiva.id, {
                              escalaX: valor,
                              escalaY: valor,
                            });
                          }}
                          className="w-full accent-indigo-600 dark:accent-cyan-500"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">
                          Para estirar el ancho o alto por separado, usa los
                          puntos del marco en el lienzo.
                        </p>

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

                {/* Selector interactivo de tipografía */}
                <label className="mb-2 mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Fuente ({fuentesVisibles.length})
                </label>

                {/* Filtros por categoría */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CATEGORIAS_FUENTE.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFiltroFuente(cat.id)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                        filtroFuente === cat.id
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                          : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-500/50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Tarjetas: cada una se dibuja con su propia tipografía para
                    reconocerla de un vistazo; hover con elevación y borde. */}
                <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-gray-100 p-1.5 dark:border-slate-800">
                  {fuentesVisibles.map((fuente) => {
                    const activa = fuenteTexto === fuente.css;
                    return (
                      <button
                        key={fuente.id}
                        type="button"
                        onClick={() => setFuenteTexto(fuente.css)}
                        title={`Aplicar ${fuente.nombre}`}
                        aria-pressed={activa}
                        style={{ fontFamily: fuente.css }}
                        className={`flex flex-col items-center justify-center rounded-lg border px-1 py-2 transition duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                          activa
                            ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:ring-cyan-500/40"
                            : "border-gray-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-500/50"
                        }`}
                      >
                        <span
                          className={`truncate text-lg leading-tight ${
                            activa
                              ? "text-indigo-700 dark:text-cyan-300"
                              : "text-gray-700 dark:text-slate-200"
                          }`}
                        >
                          Aa
                        </span>
                        <span
                          className={`w-full truncate text-center text-[9px] ${
                            activa
                              ? "font-semibold text-indigo-600 dark:text-cyan-400"
                              : "text-gray-400 dark:text-slate-500"
                          }`}
                        >
                          {fuente.nombre}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Vista previa en vivo del texto con la fuente y color elegidos */}
                <div className="mt-2 flex min-h-[44px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                  {textoDiseno.trim() ? (
                    <span
                      className="truncate text-xl leading-tight"
                      style={{ fontFamily: fuenteTexto, color: colorTexto }}
                    >
                      {textoDiseno}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      Escribe un texto para ver la vista previa
                    </span>
                  )}
                </div>

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

          {/* Zona de diseño: mockup editable (arrastrar, redimensionar y
              rotar con react-moveable) de la ubicación activa, con zoom y
              modo maximizado. Se oculta mientras está maximizado. */}
          {!lienzoMaximizado && (
            <div className="relative flex min-h-[540px] flex-1 flex-col rounded-2xl border border-gray-200 bg-gray-200 p-6 dark:border-slate-700 dark:bg-slate-800">
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

              <div className="absolute left-4 top-4 z-10">{controlZoom}</div>

              <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl">
                <div
                  className="min-w-[280px]"
                  style={{ width: `${zoomLienzo * 100}%` }}
                >
                  {lienzoMockup}
                </div>
              </div>

              <p className="pt-3 text-center text-xs text-gray-400 dark:text-slate-500">
                Editando: {etiquetaCaraActiva}
                {caraActiva.startsWith("manga") && " (incluye el costado)"}
                {" · "}arrastra para mover, esquinas para escalar y rotar ·
                usa − / + para acercar o alejar el lienzo
              </p>
            </div>
          )}

          {/* Vista previa 3D (rotable, con zoom) + acceso a pantalla completa */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:w-[300px] lg:shrink-0">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
              Vista previa 3D
            </h2>

            <div className="mb-4 flex items-center justify-center overflow-hidden rounded-xl bg-gray-100 p-4 dark:bg-slate-800">
              <div className="relative h-80 w-full" style={{ aspectRatio: "220 / 260" }}>
                <Prenda3D
                  key={selectedProduct}
                  tipo={selectedProduct}
                  color={colorSeleccionado ?? "#ffffff"}
                  imagenes={imagenes}
                  texto={textoDiseno}
                  colorTexto={colorTexto}
                  fuenteTexto={fuenteTexto}
                  tamanoTexto={tamanoTexto}
                  posicionTexto={posicionTexto}
                  rotacionTexto={rotacionTexto}
                  escalaTexto={escalaTexto}
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
              disabled={guardandoDiseno}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              {guardandoDiseno ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaSave />
              )}
              {guardandoDiseno ? "Guardando..." : "Guardar diseño"}
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

      {/* Lienzo maximizado: pantalla completa del editor 2D */}
      {lienzoMaximizado && (
        <div className="fixed inset-0 z-40 flex flex-col bg-slate-950/95 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-bold text-white">
              Editando: {selectedProduct === "camiseta" ? etiquetaCaraActiva : `Mug · ${etiquetaCaraActiva}`}
            </h2>
            <div className="flex items-center gap-3">
              {controlZoom}
              <button
                type="button"
                onClick={() => setLienzoMaximizado(false)}
                aria-label="Minimizar el lienzo"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto px-6 pb-6">
            <div
              className="min-w-[320px]"
              style={{ width: `${zoomLienzo * 100}%` }}
            >
              {lienzoMockup}
            </div>
          </div>
        </div>
      )}

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
                fuenteTexto={fuenteTexto}
                tamanoTexto={tamanoTexto}
                posicionTexto={posicionTexto}
                rotacionTexto={rotacionTexto}
                escalaTexto={escalaTexto}
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
