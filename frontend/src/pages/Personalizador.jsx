import { useEffect, useMemo, useRef, useState } from "react";
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
  FaPrint,
  FaImages,
} from "react-icons/fa";
import { Shirt, Coffee } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { guardarPersonalizacion } from "../services/personalizacionService";
import { generarDiseno, subirDiseno } from "../services/disenoService";
import { listarPlantillas } from "../services/plantillaService";
import { getErrorMessage } from "../services/api";
import PrendaMockup, {
  ANCHO_IMAGEN_BASE,
  ESCALA_MIN,
  ESCALA_MAX,
  obtenerBaseMockup,
} from "../components/ui/PrendaMockup";
import Prenda3D from "../components/ui/Prenda3D";
import { removeBackground } from "@imgly/background-removal";
import procesarDiseno from "../utils/quitarFondoBlanco";
import {
  FUENTES_TEXTO,
  FUENTE_TEXTO_DEFECTO,
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

// Emojis de inserción rápida para el texto del personalizador.
const EMOJIS_RAPIDOS = ["⭐", "🐶", "❤️", "🔥", "🎉", "✨", "⚽", "👑"];

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

// Identificador único para cada imagen insertada (helper de módulo: Date.now
// y Math.random no pueden llamarse dentro del render del componente).
function crearIdImagen() {
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Pequeño desplazamiento aleatorio (%) para que al agregar varias imágenes no
// queden exactamente apiladas y sea más fácil separarlas.
function desplazamientoAleatorio() {
  return Math.round((Math.random() - 0.5) * 16);
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
// Intenta primero con crossOrigin anónimo (evita "tainted canvas" al componer
// el diseño o subir la textura a Three.js); si el servidor remoto no expone
// cabeceras CORS (p. ej. buckets de Supabase sin política), reintenta sin él
// para que la imagen igualmente se dibuje y sea editable en el lienzo.
function cargarImagenElemento(url) {
  const intentar = (conCors) =>
    new Promise((resolve) => {
      const img = new Image();
      if (conCors) img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  return intentar(true).then((img) => img ?? intentar(false));
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
const DPI_OBJETIVO = 300;
// Sangrado para sublimación (se imprime más allá del corte y se recorta).
const BLEED_PX = 36;
// Margen seguro: lo que nunca se corta, aunque haya desalineación.
const MARGEN_SEGURO_PX = 80;

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

function descargarDataUrl(dataUrl, nombreArchivo) {
  const enlace = document.createElement("a");
  enlace.href = dataUrl;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

// Normaliza un HEX (con o sin '#', 3 o 6 dígitos) a la forma #rrggbb que
// exige <input type="color">; si no es válido devuelve null para usar un
// color por defecto sin romper el selector.
function normalizarHexParaPicker(valor) {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec((valor ?? "").trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${hex}`;
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

  // Capas de emoji independientes: cada emoji es un objeto con su propia
  // posición, escala, rotación y tamaño, seleccionable/arrastrable/redimensionable
  // por separado (igual que las imágenes), en lugar de concatenarse al texto.
  const [emojis, setEmojis] = useState([]); // { id, emoji, cara, x, y, escala, rotacion, tamano }
  const [emojiActivoId, setEmojiActivoId] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [generandoIA, setGenerandoIA] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState(null); // hex
  const [textoDiseno, setTextoDiseno] = useState("");
  const [colorTexto, setColorTexto] = useState("#111111");
  const [fuenteTexto, setFuenteTexto] = useState(FUENTE_TEXTO_DEFECTO);
  const [busquedaFuente, setBusquedaFuente] = useState("");
  const [tamanoTexto, setTamanoTexto] = useState(32);
  // Formato del texto: negrita, cursiva y subrayado (se aplica en el lienzo
  // 2D, en la proyección 3D y en la imagen final guardada).
  const [esNegrita, setEsNegrita] = useState(false);
  const [esCursiva, setEsCursiva] = useState(false);
  const [esSubrayado, setEsSubrayado] = useState(false);
  const [posicionTexto, setPosicionTexto] = useState({ x: 50, y: 50 });
  const [rotacionTexto, setRotacionTexto] = useState(0);
  const [escalaTexto, setEscalaTexto] = useState(1);
  const [textoActivo, setTextoActivo] = useState(false);
  const [herramienta, setHerramienta] = useState("imagen"); // "imagen" | "plantillas" | "texto" | "color"
  const [guardando, setGuardando] = useState(false);
  // Guardado del diseño compuesto en "Mis diseños" (endpoint /disenos/subir).
  const [guardandoDiseno, setGuardandoDiseno] = useState(false);
  const [descargandoPrint, setDescargandoPrint] = useState(false);
  const [mostrarGuiasImpresion, setMostrarGuiasImpresion] = useState(true);
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

  // Galería de plantillas prediseñadas: se carga la primera vez que se abre
  // la pestaña y se filtra en cliente por categoría y compatibilidad.
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  const [errorPlantillas, setErrorPlantillas] = useState(null);
  const [categoriaPlantilla, setCategoriaPlantilla] = useState("todas");
  const plantillasCargadasRef = useRef(false);

  const imagenActiva = imagenes.find((img) => img.id === imagenActivaId) ?? null;
  const emojiActivo = emojis.find((e) => e.id === emojiActivoId) ?? null;

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
  // Emojis de la cara activa (misma regla que las imágenes).
  const emojisEnCaraActiva = emojis.filter((e) => (e.cara ?? "frente") === caraActiva);

  const hayDiseno = Boolean(
    imagenes.length || emojis.length || colorSeleccionado || textoDiseno.trim()
  );

  const total = useMemo(() => precioBase + COSTO_PERSONALIZACION, [precioBase]);

// Fuentes del menú, filtradas por búsqueda en tiempo real.
  const fuentesVisibles = useMemo(
    () => {
      const bajo = busquedaFuente.toLowerCase();
      if (!busquedaFuente) return FUENTES_TEXTO;
      return FUENTES_TEXTO.filter(
        (f) =>
          f.nombre.toLowerCase().includes(bajo) ||
          f.css.toLowerCase().includes(bajo)
      );
    },
    [busquedaFuente]
  );

  // --- Galería de plantillas prediseñadas ---

  // Carga única y diferida: solo se pide al backend la primera vez que se
  // abre la pestaña (o al reintentar tras un error).
  const cargarGaleriaPlantillas = async () => {
    setCargandoPlantillas(true);
    setErrorPlantillas(null);
    try {
      const datos = await listarPlantillas();
      setPlantillas(datos);
      plantillasCargadasRef.current = true;
    } catch (err) {
      setErrorPlantillas(getErrorMessage(err));
    } finally {
      setCargandoPlantillas(false);
    }
  };

  useEffect(() => {
    if (herramienta !== "plantillas") return;
    if (!plantillasCargadasRef.current) cargarGaleriaPlantillas();
  }, [herramienta]);

  // Tabs de categoría derivadas de los datos (se adapta a lo que haya en BD).
  const categoriasPlantillas = useMemo(
    () => [...new Set(plantillas.map((p) => p.categoria))],
    [plantillas]
  );

  // Plantillas visibles: categoría elegida + compatibles con el producto
  // actual ("ambos" siempre aplica; el resto se oculta al cambiar de producto).
  const plantillasVisibles = useMemo(
    () =>
      plantillas.filter(
        (p) =>
          (categoriaPlantilla === "todas" ||
            p.categoria === categoriaPlantilla) &&
          (p.productoTipoCompatible === selectedProduct ||
            p.productoTipoCompatible === "ambos")
      ),
    [plantillas, categoriaPlantilla, selectedProduct]
  );

  // Aplica la plantilla como imagen de diseño en la cara activa: mismo camino
  // que subir una imagen, así queda seleccionada, arrastrable y redimensionable
  // con el editor normal. Carga el PNG real en el lienzo (nunca un placeholder)
  // validando ambas formas del campo de imagen.
  const aplicarPlantilla = async (plantilla) => {
    if (!plantilla) return;

    // Soporta camelCase y snake_case según cómo serialice el backend.
    const url = plantilla.imagenUrl || plantilla.imagen_url;
    if (!url) {
      console.error("La plantilla no tiene URL válida:", plantilla);
      setMensaje({
        tipo: "error",
        texto: "La plantilla no tiene una imagen disponible.",
      });
      return;
    }

    try {
      // Precarga del PNG real con CORS anónimo antes de insertar la capa;
      // cargarImagenElemento reintenta sin CORS si el bucket lo bloquea, así
      // el estampado se dibuja igualmente en el lienzo 2D y en las texturas
      // de Three.js (Prenda3D).
      const img = await cargarImagenElemento(url);
      if (!img) {
        console.error(
          `No se pudo cargar la imagen de la plantilla "${plantilla.nombre}":`,
          url
        );
        setMensaje({
          tipo: "error",
          texto: `No se pudo cargar la imagen de "${plantilla.nombre}".`,
        });
        return;
      }

      // Función real del archivo que agrega capas al lienzo y las vuelve
      // seleccionables/arrastrables con el editor normal.
      await agregarImagen(url);
      setMensaje({
        tipo: "ok",
        texto: `Plantilla "${plantilla.nombre}" agregada. Muévela y ajústala a tu gusto.`,
      });
    } catch (err) {
      console.error("Error cargando la plantilla en el canvas:", err);
      setMensaje({
        tipo: "error",
        texto: "No fue posible aplicar la plantilla al lienzo.",
      });
    }
  };

  const agregarImagen = async (url) => {
    const id = crearIdImagen();
    const offset = desplazamientoAleatorio();

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
    setEmojiActivoId(null);
    if (id) setTextoActivo(false);
  };

  const seleccionarTexto = () => {
    setImagenActivaId(null);
    setEmojiActivoId(null);
    setTextoActivo(true);
  };

  const handleTextoTransform = (patch) => {
    if (patch.rotacion !== undefined) setRotacionTexto(patch.rotacion);
    if (patch.escala !== undefined) setEscalaTexto(patch.escala);
  };

  // Añade un emoji como CAPA INDEPENDIENTE del lienzo (no se concatena al
  // texto): cada emoji guarda su propia cara, posición, escala, rotación y
  // tamaño, y queda seleccionado para moverlo/redimensionarlo libremente.
  const agregarEmoji = (emoji) => {
    const id = crearIdImagen();
    const offset = desplazamientoAleatorio();
    const nuevo = {
      id,
      emoji,
      cara: caraActiva,
      x: 50 + offset,
      y: 45 + offset,
      escala: 1,
      rotacion: 0,
      tamano: 48,
    };
    setEmojis((prev) => [...prev, nuevo]);
    setEmojiActivoId(id);
    setImagenActivaId(null);
    setTextoActivo(false);
  };

  const actualizarEmoji = (id, patch) => {
    setEmojis((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const seleccionarEmoji = (id) => {
    setEmojiActivoId(id);
    setImagenActivaId(null);
    if (id) setTextoActivo(false);
  };

  const eliminarEmoji = (id) => {
    setEmojis((prev) => prev.filter((e) => e.id !== id));
    setEmojiActivoId((actual) => (actual === id ? null : actual));
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

  // Elimina la capa activa (imagen, texto o emoji) desde el teclado.
  const eliminarCapaActiva = () => {
    if (imagenActivaId) {
      handleEliminarImagen(imagenActivaId);
      return;
    }
    if (emojiActivoId) {
      eliminarEmoji(emojiActivoId);
      return;
    }
    if (textoActivo) {
      setTextoDiseno("");
      setTextoActivo(false);
    }
  };

  // Tecla Delete/Backspace: elimina la capa activa (imagen, emoji o texto).
  // Se ignora cuando el foco está en un input/textarea para no borrar texto
  // mientras se escribe.
  useEffect(() => {
    const alTeclado = (e) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const objetivo = e.target;
      const esCampo =
        objetivo &&
        (objetivo.tagName === "INPUT" ||
          objetivo.tagName === "TEXTAREA" ||
          objetivo.isContentEditable);
      if (esCampo) return;
      eliminarCapaActiva();
    };
    window.addEventListener("keydown", alTeclado);
    return () => window.removeEventListener("keydown", alTeclado);
  });

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
    setEmojis([]);
    setEmojiActivoId(null);
    setTextoActivo(false);
    setColorSeleccionado(null);
    setTextoDiseno("");
    setColorTexto("#111111");
    setFuenteTexto(FUENTE_TEXTO_DEFECTO);
    setTamanoTexto(32);
    setEsNegrita(false);
    setEsCursiva(false);
    setEsSubrayado(false);
    setPosicionTexto({ x: 50, y: 50 });
    setRotacionTexto(0);
    setEscalaTexto(1);
    setPrompt("");
    setCaraActiva("frente");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMensaje(null);
  };

  // Aplana el mockup de la vista activa (producto + color) junto con las
  // imágenes y el texto en una sola imagen PNG, idéntica a lo que se ve en el
  // lienzo 2D: así la personalización guardada muestra la prenda de fondo y
  // no solo el diseño suelto. La posición de cada elemento es libre ({x, y}
  // en %), la misma que usa el editor con react-moveable.
  const componerImagenFinal = async () => {
    if (!imagenes.length && !emojis.length && !textoDiseno.trim()) return null;

    const canvas = document.createElement("canvas");
    canvas.width = TAMANO_LIENZO;
    canvas.height = TAMANO_LIENZO;
    const ctx = canvas.getContext("2d");

    // 1. Producto de fondo: misma imagen base y encuadre que PrendaMockup
    //    (a alto completo del lienzo, centrada horizontalmente; si es más
    //    ancha que el cuadrado, se recorta por los lados como en pantalla).
    const baseImg = await cargarImagenElemento(
      obtenerBaseMockup(selectedProduct, caraActiva)
    );
    let encuadreBase = null;
    if (baseImg) {
      const anchoBase =
        TAMANO_LIENZO * (baseImg.naturalWidth / baseImg.naturalHeight);
      encuadreBase = {
        dx: (TAMANO_LIENZO - anchoBase) / 2,
        dw: anchoBase,
      };
      ctx.drawImage(baseImg, encuadreBase.dx, 0, encuadreBase.dw, TAMANO_LIENZO);
    }

    // 2. Color del producto: silueta rellena con el color elegido y mezclada
    //    en "multiply" sobre la foto (igual que la capa de color del editor).
    if (baseImg && colorSeleccionado) {
      const capaColor = document.createElement("canvas");
      capaColor.width = TAMANO_LIENZO;
      capaColor.height = TAMANO_LIENZO;
      const ctxColor = capaColor.getContext("2d");
      ctxColor.drawImage(baseImg, encuadreBase.dx, 0, encuadreBase.dw, TAMANO_LIENZO);
      ctxColor.globalCompositeOperation = "source-in";
      ctxColor.fillStyle = colorSeleccionado;
      ctxColor.fillRect(0, 0, TAMANO_LIENZO, TAMANO_LIENZO);

      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(capaColor, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }

    // 3. Diseños + texto en una capa aparte, para poder recortarlos con la
    //    silueta del producto igual que en el editor (en las vistas de manga
    //    se permite desbordar hacia el costado del torso).
    const permitirDesborde =
      selectedProduct === "camiseta" &&
      (caraActiva === "mangaIzquierda" || caraActiva === "mangaDerecha");

    const capaDiseno = document.createElement("canvas");
    capaDiseno.width = TAMANO_LIENZO;
    capaDiseno.height = TAMANO_LIENZO;
    const ctxDiseno = capaDiseno.getContext("2d");

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

      ctxDiseno.save();
      ctxDiseno.translate(cx, cy);
      ctxDiseno.rotate(((imagen.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.drawImage(el, -baseW / 2, -baseH / 2, baseW, baseH);
      ctxDiseno.restore();
    }

    if (textoDiseno.trim()) {
      // Asegura que la fuente web esté descargada antes de dibujar; si no,
      // el canvas caería al fallback y la imagen guardada no coincidiría.
      await cargarFuenteParaCanvas(fuenteTexto);
      ctxDiseno.save();
      ctxDiseno.translate(
        (posicionTexto.x / 100) * TAMANO_LIENZO,
        (posicionTexto.y / 100) * TAMANO_LIENZO
      );
      ctxDiseno.rotate(((rotacionTexto ?? 0) * Math.PI) / 180);
      ctxDiseno.scale(escalaTexto ?? 1, escalaTexto ?? 1);
      ctxDiseno.fillStyle = colorTexto;
      const peso = esNegrita ? "700" : "600";
      const estiloFuente = esCursiva ? "italic " : "";
      ctxDiseno.font = `${estiloFuente}${peso} ${Math.round(tamanoTexto * FACTOR_LIENZO)}px ${fuenteTexto}`;
      ctxDiseno.textAlign = "center";
      ctxDiseno.textBaseline = "middle";
      ctxDiseno.fillText(textoDiseno, 0, 0);
      // Subrayado: el canvas no tiene textDecoration, se dibuja una línea bajo
      // el texto usando el ancho medido y un grosor proporcional al tamaño.
      if (esSubrayado) {
        const anchoTexto = ctxDiseno.measureText(textoDiseno).width;
        const tamDibujo = Math.round(tamanoTexto * FACTOR_LIENZO);
        ctxDiseno.strokeStyle = colorTexto;
        ctxDiseno.lineWidth = Math.max(2, tamDibujo * 0.08);
        ctxDiseno.beginPath();
        ctxDiseno.moveTo(-anchoTexto / 2, tamDibujo * 0.45);
        ctxDiseno.lineTo(anchoTexto / 2, tamDibujo * 0.45);
        ctxDiseno.stroke();
      }
      ctxDiseno.restore();
    }

    // Emojis como capas independientes: cada uno con su posición, escala,
    // rotación y tamaño propios (mismo encuadre que el editor 2D).
    for (const emoji of emojisEnCaraActiva) {
      const tamDibujo = Math.round((emoji.tamano ?? 48) * FACTOR_LIENZO * (emoji.escala ?? 1));
      ctxDiseno.save();
      ctxDiseno.translate(
        (emoji.x / 100) * TAMANO_LIENZO,
        (emoji.y / 100) * TAMANO_LIENZO
      );
      ctxDiseno.rotate(((emoji.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.font = `${tamDibujo}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctxDiseno.textAlign = "center";
      ctxDiseno.textBaseline = "middle";
      ctxDiseno.fillText(emoji.emoji, 0, 0);
      ctxDiseno.restore();
    }

    // Recorte a la silueta: "destination-in" conserva únicamente lo que cae
    // dentro del producto (máscara igual a la del editor 2D).
    if (baseImg && !permitirDesborde) {
      ctxDiseno.globalCompositeOperation = "destination-in";
      ctxDiseno.drawImage(baseImg, encuadreBase.dx, 0, encuadreBase.dw, TAMANO_LIENZO);
      ctxDiseno.globalCompositeOperation = "source-over";
    }
    ctx.drawImage(capaDiseno, 0, 0);

    return canvas.toDataURL("image/png");
  };

  // Versión print-ready: mismo contenido pero con sangrado, marcas de corte y a
  // resolución de impresión (300 DPI). No recorta por máscara, deja el sangrado
  // imprimible para la prensa de sublimación.
  const componerImagenPrintReady = async () => {
    if (!imagenes.length && !emojis.length && !textoDiseno.trim()) return null;

    const PRINT_SIZE = 3000;
    const escala = PRINT_SIZE / TAMANO_LIENZO;
    const bleed = Math.round(BLEED_PX * escala);
    const size = PRINT_SIZE + bleed * 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    const baseImg = await cargarImagenElemento(
      obtenerBaseMockup(selectedProduct, caraActiva)
    );
    let encuadreBase = null;
    if (baseImg) {
      const anchoBase = PRINT_SIZE * (baseImg.naturalWidth / baseImg.naturalHeight);
      encuadreBase = { dx: bleed + (PRINT_SIZE - anchoBase) / 2, dw: anchoBase };
      ctx.drawImage(baseImg, encuadreBase.dx, bleed, encuadreBase.dw, PRINT_SIZE);
    }

    if (baseImg && colorSeleccionado) {
      const capaColor = document.createElement("canvas");
      capaColor.width = size;
      capaColor.height = size;
      const ctxColor = capaColor.getContext("2d");
      ctxColor.drawImage(baseImg, encuadreBase.dx, bleed, encuadreBase.dw, PRINT_SIZE);
      ctxColor.globalCompositeOperation = "source-in";
      ctxColor.fillStyle = colorSeleccionado;
      ctxColor.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(capaColor, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }

    const permitirDesborde =
      selectedProduct === "camiseta" &&
      (caraActiva === "mangaIzquierda" || caraActiva === "mangaDerecha");

    const capaDiseno = document.createElement("canvas");
    capaDiseno.width = size;
    capaDiseno.height = size;
    const ctxDiseno = capaDiseno.getContext("2d");

    for (const imagen of imagenes) {
      const procesada = await procesarDiseno(imagen.url);
      const el = await cargarImagenElemento(procesada?.dataUrl ?? imagen.url);
      if (!el) continue;
      const baseW = PRINT_SIZE * ANCHO_IMAGEN_BASE * (imagen.escalaX ?? imagen.escala ?? 1);
      const baseH = baseW * (el.naturalHeight / el.naturalWidth) * (imagen.escalaY ?? imagen.escala ?? 1);
      const cx = bleed + (imagen.x / 100) * PRINT_SIZE;
      const cy = bleed + (imagen.y / 100) * PRINT_SIZE;
      ctxDiseno.save();
      ctxDiseno.translate(cx, cy);
      ctxDiseno.rotate(((imagen.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.drawImage(el, -baseW / 2, -baseH / 2, baseW, baseH);
      ctxDiseno.restore();
    }

    if (textoDiseno.trim()) {
      await cargarFuenteParaCanvas(fuenteTexto);
      ctxDiseno.save();
      ctxDiseno.translate(
        bleed + (posicionTexto.x / 100) * PRINT_SIZE,
        bleed + (posicionTexto.y / 100) * PRINT_SIZE
      );
      ctxDiseno.rotate(((rotacionTexto ?? 0) * Math.PI) / 180);
      ctxDiseno.scale(escalaTexto ?? 1, escalaTexto ?? 1);
      ctxDiseno.fillStyle = colorTexto;
      const peso = esNegrita ? "700" : "600";
      const estiloFuente = esCursiva ? "italic " : "";
      ctxDiseno.font = `${estiloFuente}${peso} ${Math.round(tamanoTexto * FACTOR_LIENZO * escala)}px ${fuenteTexto}`;
      ctxDiseno.textAlign = "center";
      ctxDiseno.textBaseline = "middle";
      ctxDiseno.fillText(textoDiseno, 0, 0);
      if (esSubrayado) {
        const anchoTexto = ctxDiseno.measureText(textoDiseno).width;
        const tamDibujo = Math.round(tamanoTexto * FACTOR_LIENZO * escala);
        ctxDiseno.strokeStyle = colorTexto;
        ctxDiseno.lineWidth = Math.max(2, tamDibujo * 0.08);
        ctxDiseno.beginPath();
        ctxDiseno.moveTo(-anchoTexto / 2, tamDibujo * 0.45);
        ctxDiseno.lineTo(anchoTexto / 2, tamDibujo * 0.45);
        ctxDiseno.stroke();
      }
      ctxDiseno.restore();
    }

    for (const emoji of emojisEnCaraActiva) {
      const tamDibujo = Math.round((emoji.tamano ?? 48) * FACTOR_LIENZO * escala * (emoji.escala ?? 1));
      ctxDiseno.save();
      ctxDiseno.translate(
        bleed + (emoji.x / 100) * PRINT_SIZE,
        bleed + (emoji.y / 100) * PRINT_SIZE
      );
      ctxDiseno.rotate(((emoji.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.font = `${tamDibujo}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctxDiseno.textAlign = "center";
      ctxDiseno.textBaseline = "middle";
      ctxDiseno.fillText(emoji.emoji, 0, 0);
      ctxDiseno.restore();
    }

    if (baseImg && !permitirDesborde) {
      ctxDiseno.globalCompositeOperation = "destination-in";
      ctxDiseno.drawImage(baseImg, encuadreBase.dx, bleed, encuadreBase.dw, PRINT_SIZE);
      ctxDiseno.globalCompositeOperation = "source-over";
    }
    ctx.drawImage(capaDiseno, 0, 0);

    // Marcas de corte en las esquinas del sangrado.
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    const m = 18 * escala;
    const b = bleed;
    const s = size;
    // Sup. izq.
    ctx.beginPath(); ctx.moveTo(b, m); ctx.lineTo(b, b); ctx.lineTo(m, b); ctx.stroke();
    // Sup. der.
    ctx.beginPath(); ctx.moveTo(s - m, b); ctx.lineTo(s - b, b); ctx.lineTo(s - b, m); ctx.stroke();
    // Inf. izq.
    ctx.beginPath(); ctx.moveTo(b, s - m); ctx.lineTo(b, s - b); ctx.lineTo(m, s - b); ctx.stroke();
    // Inf. der.
    ctx.beginPath(); ctx.moveTo(s - b, s - m); ctx.lineTo(s - b, s - b); ctx.lineTo(s - m, s - b); ctx.stroke();

    return canvas.toDataURL("image/png");
  };

  const handleDescargarPrintReady = async () => {
    if (!hayDiseno) {
      setMensaje({ tipo: "error", texto: "No hay diseño para exportar." });
      return;
    }
    setDescargandoPrint(true);
    try {
      const dataUrl = await componerImagenPrintReady();
      if (!dataUrl) return;
      const sufijo = selectedProduct === "camiseta" ? caraActiva : caraActiva;
      descargarDataUrl(dataUrl, `skd-print-${sufijo}.png`);
      setMensaje({ tipo: "ok", texto: `Archivo print-ready (${DPI_OBJETIVO} DPI + sangrado) descargado.` });
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo generar el archivo de impresión." });
    } finally {
      setDescargandoPrint(false);
    }
  };

  // Guarda el mockup compuesto (producto + color + diseño estampado) como un
  // Diseño con origen USUARIO: aparece en "Mis diseños" del panel con la
  // prenda de fondo, no el gráfico suelto.
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
          emojis.length ? `Emojis insertados: ${emojis.length}` : null,
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
      emojis={emojisEnCaraActiva}
      emojiActivoId={emojiActivoId}
      onEmojiChange={actualizarEmoji}
      onSeleccionarEmoji={seleccionarEmoji}
      texto={caraActiva === "frente" ? textoDiseno : ""}
      colorTexto={colorTexto}
      fuenteTexto={fuenteTexto}
      tamanoTexto={tamanoTexto}
      esNegrita={esNegrita}
      esCursiva={esCursiva}
      esSubrayado={esSubrayado}
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

            {/* Tira de pestañas: imagen / plantillas / texto / color */}
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
                aria-label="Herramienta de plantillas"
                title="Plantillas"
                onClick={() => setHerramienta("plantillas")}
                className={`flex flex-1 items-center justify-center rounded-lg py-2 transition ${
                  herramienta === "plantillas"
                    ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                    : "text-gray-400 hover:bg-gray-100 dark:text-slate-500 dark:hover:bg-slate-800"
                }`}
              >
                <FaImages className="text-sm" />
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
            ) : herramienta === "plantillas" ? (
              <>
                {/* Galería de plantillas prediseñadas: arrancar de un diseño
                    ya hecho en vez de empezar en blanco. */}
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Plantillas para {selectedProduct === "camiseta" ? "camiseta" : "mug"}
                </p>

                {/* Tabs de categoría (derivadas de las plantillas cargadas) */}
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {["todas", ...categoriasPlantillas].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaPlantilla(cat)}
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition ${
                        categoriaPlantilla === cat
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                          : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-500/50"
                      }`}
                    >
                      {cat === "todas" ? "Todas" : cat}
                    </button>
                  ))}
                </div>

                {cargandoPlantillas ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-xs text-gray-400 dark:text-slate-500">
                    <FaSpinner className="animate-spin text-lg" />
                    Cargando plantillas...
                  </div>
                ) : errorPlantillas ? (
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 py-8 px-3 text-center dark:border-slate-700">
                    <FaExclamationTriangle className="text-lg text-red-400" />
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      No fue posible cargar las plantillas: {errorPlantillas}
                    </p>
                    <button
                      type="button"
                      onClick={cargarGaleriaPlantillas}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : plantillasVisibles.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 py-8 px-3 text-center dark:border-slate-700">
                    <FaImages className="text-lg text-gray-300 dark:text-slate-600" />
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      No hay plantillas para esta categoría y producto todavía.
                    </p>
                  </div>
                ) : (
                  <div className="grid max-h-[450px] grid-cols-2 gap-3 overflow-y-auto rounded-xl border border-gray-100 p-2 dark:border-slate-800">
                    {plantillasVisibles.map((plantilla) => (
                      <button
                        key={plantilla.id}
                        type="button"
                        onClick={() => aplicarPlantilla(plantilla)}
                        title={`Aplicar "${plantilla.nombre}"`}
                        className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition duration-150 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-cyan-500/50"
                      >
                        <span className="flex h-24 w-full items-center justify-center overflow-hidden bg-gray-50 p-1 dark:bg-slate-950">
                          <img
                            src={plantilla.imagenUrl || plantilla.imagen_url}
                            alt={plantilla.nombre}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                        <span className="truncate px-1 py-1 text-center text-[10px] font-medium text-gray-500 transition group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-cyan-300">
                          {plantilla.nombre}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {plantillasVisibles.length > 0 && (
                  <p className="mt-2 text-[10px] leading-snug text-gray-400 dark:text-slate-500">
                    Toca una plantilla para agregarla al lienzo; luego muévela,
                    redimenciónala o cámbiale la ubicación como cualquier imagen.
                  </p>
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

                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400 dark:text-slate-500" viewBox="0 0 24 24">
                    <path d="M21 21l-3.33-3.33l-2.21 2.21l5.45 5.45l-1.42 1.42zM21 3l-3.33 3.33l2.21 2.21l-5.45-5.45l1.42-1.42zM3 3l3.33-3.33l-2.21-2.21l5.45 5.45l-1.42-1.42zM3 21l3.33 3.33l-2.21 2.21l-5.45-5.45l1.42 1.42zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 4v12c1.1 0 2-0.9 2-2V4c0-1.1-0.9-2-2-2z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar fuente..."
                    value={busquedaFuente}
                    onChange={(e) => setBusquedaFuente(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-sm text-gray-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 flex-1"
                  />
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

                {/* Formato del texto: negrita, cursiva y subrayado */}
                <label className="mb-2 mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Formato
                </label>
                <div className="mb-4 flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-pressed={esNegrita}
                    title="Negrita"
                    onClick={() => setEsNegrita((v) => !v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${
                      esNegrita
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-300"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400"
                    }`}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    aria-pressed={esCursiva}
                    title="Cursiva"
                    onClick={() => setEsCursiva((v) => !v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold italic transition ${
                      esCursiva
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-300"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400"
                    }`}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    aria-pressed={esSubrayado}
                    title="Subrayado"
                    onClick={() => setEsSubrayado((v) => !v)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold underline transition ${
                      esSubrayado
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-300"
                        : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400"
                    }`}
                  >
                    U
                  </button>
                </div>

                {/* Emojis como capas independientes en el lienzo */}
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Emojis
                </label>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {EMOJIS_RAPIDOS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => agregarEmoji(emoji)}
                      title={`Agregar ${emoji} como capa`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:hover:border-cyan-400"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {emojis.length > 0 && (
                  <>
                    <div className="my-3 border-t border-gray-200 dark:border-slate-800" />
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                      Emojis agregados ({emojis.length})
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {emojis.map((em) => (
                        <button
                          key={em.id}
                          type="button"
                          onClick={() => seleccionarEmoji(em.id)}
                          title="Seleccionar para mover, escalar o eliminar"
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                            em.id === emojiActivoId
                              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:ring-cyan-500/40"
                              : "border-gray-200 bg-gray-50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-cyan-500/50"
                          }`}
                        >
                          {em.emoji}
                        </button>
                      ))}
                    </div>

                    {emojiActivo && (
                      <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          Emoji seleccionado
                        </p>

                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                          Tamaño: {Math.round((emojiActivo.tamano ?? 48) * (emojiActivo.escala ?? 1))}px
                        </label>
                        <input
                          type="range"
                          min={16}
                          max={120}
                          step={2}
                          value={Math.round((emojiActivo.tamano ?? 48) * (emojiActivo.escala ?? 1))}
                          onChange={(e) => {
                            const base = emojiActivo.tamano ?? 48;
                            actualizarEmoji(emojiActivo.id, {
                              escala: Number(e.target.value) / base,
                            });
                          }}
                          className="w-full accent-indigo-600 dark:accent-cyan-500"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">
                          También puedes escalarlo arrastrando las esquinas del
                          marco en el lienzo.
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEmoji(emojiActivo.id, {
                                rotacion: ((emojiActivo.rotacion ?? 0) + 90) % 360,
                              })
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
                          >
                            <FaSyncAlt /> Rotar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarEmoji(emojiActivo.id)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-red-500 transition hover:border-red-300 dark:border-slate-700 dark:text-red-400 dark:hover:border-red-500/50"
                          >
                            <FaTrash /> Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Vista previa en vivo del texto con la fuente y color elegidos */}
                <div className="mt-2 flex min-h-[44px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                  {textoDiseno.trim() ? (
                    <span
                      className="truncate text-xl leading-tight"
                      style={{
                        fontFamily: fuenteTexto,
                        color: colorTexto,
                        fontWeight: esNegrita ? 700 : 600,
                        fontStyle: esCursiva ? "italic" : "normal",
                        textDecoration: esSubrayado ? "underline" : "none",
                      }}
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
                    value={normalizarHexParaPicker(colorTexto) ?? "#111111"}
                    onChange={(e) => setColorTexto(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border-none bg-transparent p-0"
                  />
                  <input
                    type="text"
                    maxLength="7"
                    value={colorTexto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setColorTexto(val);
                      // Si es un HEX válido (# + 3 o 6 dígitos), el color se
                      // aplica automáticamente al texto del canvas.
                      if (/^#?([0-9a-fA-F]{3}){1,2}$/.test(val)) {
                        setColorTexto(val.startsWith("#") ? val : `#${val}`);
                      }
                    }}
                    placeholder="#111111"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-700 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                  />
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

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRotacionTexto((r) => (r + 90) % 360)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
                  >
                    <FaSyncAlt /> Rotar texto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTextoDiseno("");
                      setTextoActivo(false);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-xs font-medium text-red-500 transition hover:border-red-300 dark:border-slate-700 dark:text-red-400 dark:hover:border-red-500/50"
                  >
                    <FaTrash /> Eliminar texto
                  </button>
                </div>
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

              <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                {controlZoom}
                <button
                  type="button"
                  onClick={() => setMostrarGuiasImpresion((v) => !v)}
                  aria-pressed={mostrarGuiasImpresion}
                  title={mostrarGuiasImpresion ? "Ocultar guías de impresión" : "Mostrar sangrado y área segura"}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition ${
                    mostrarGuiasImpresion
                      ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300"
                      : "border-gray-300 bg-white text-gray-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Sangrado
                </button>
              </div>

              <div className="flex flex-1 items-center justify-center overflow-auto rounded-xl">
                <div
                  className="relative min-w-[280px]"
                  style={{ width: `${zoomLienzo * 100}%` }}
                >
                  {lienzoMockup}
                  {mostrarGuiasImpresion && (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 rounded-xl border border-dashed border-red-400/80"
                        title={`Sangrado ${BLEED_PX}px · se imprime y recorta`}
                      />
                      <div
                        className="pointer-events-none absolute rounded-xl border border-dashed border-emerald-500/70"
                        style={{
                          inset: `${((MARGEN_SEGURO_PX / TAMANO_LIENZO) * 100).toFixed(2)}%`,
                        }}
                        title="Área segura · lo importante debe quedar dentro"
                      />
                      <span className="pointer-events-none absolute left-1/2 top-1.5 -translate-x-1/2 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white">
                        SANGRADO {BLEED_PX}px · {DPI_OBJETIVO} DPI
                      </span>
                    </>
                  )}
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
                  emojis={emojis}
                  texto={textoDiseno}
                  colorTexto={colorTexto}
                  fuenteTexto={fuenteTexto}
                  tamanoTexto={tamanoTexto}
                  esNegrita={esNegrita}
                  esCursiva={esCursiva}
                  esSubrayado={esSubrayado}
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
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
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
              onClick={handleDescargarPrintReady}
              disabled={descargandoPrint || !hayDiseno}
              title="PNG a 3000px con sangrado y marcas de corte para imprenta"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              {descargandoPrint ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPrint />
              )}
              {descargandoPrint ? "Generando print..." : "Descargar print-ready"}
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
                emojis={emojis}
                texto={textoDiseno}
                colorTexto={colorTexto}
                fuenteTexto={fuenteTexto}
                tamanoTexto={tamanoTexto}
                esNegrita={esNegrita}
                esCursiva={esCursiva}
                esSubrayado={esSubrayado}
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
