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
  FaTimes,
  FaExclamationTriangle,
  FaPrint,
  FaImages,
  FaBeer,
  FaMoon,
} from "react-icons/fa";
import { Coffee } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { guardarPersonalizacion } from "../services/personalizacionService";
import { generarDiseno, subirDiseno } from "../services/disenoService";
import { listarPlantillas } from "../services/plantillaService";
import { listarProductos } from "../services/productService";
import { getErrorMessage } from "../services/api";
import pocilloFrente from "../assets/images/products/base/pocillo-frente.png";
import pocilloAsa from "../assets/images/products/base/pocillo-asa.png";
import Prenda3D, {
  ESCALA_MIN_3D,
  ESCALA_MAX_3D,
} from "../components/ui/Prenda3D";
import { removeBackground } from "@imgly/background-removal";
import procesarDiseno from "../utils/quitarFondoBlanco";
import {
  FUENTES_TEXTO,
  FUENTE_TEXTO_DEFECTO,
  buscarFuente,
  cargarFuenteParaCanvas,
} from "../utils/fuentesTexto";
import {
  componerTexturaCamisetaAltaResolucion,
  TAMANO_TEX_ALTA_RESOLUCION,
  BLEED_PX_300DPI,
  BLEED_MM_DEFECTO,
  componerMugPrintReady,
  MUG_PRINT_WIDTH_PX,
  MUG_PRINT_HEIGHT_PX,
  JARRA_PRINT_WIDTH_PX,
  JARRA_PRINT_HEIGHT_PX,
} from "../utils/texturaPrenda";

const COSTO_PERSONALIZACION = 5000;

// Tamaño del lienzo (px) donde se "aplana" el diseño final antes de guardarlo.
const TAMANO_LIENZO = 1000;
// El mockup de referencia mide 500px; el texto y las imágenes se escalan a este
// lienzo más grande para que la imagen guardada se vea nítida.
const FACTOR_LIENZO = TAMANO_LIENZO / 500;

// Ancho base de una imagen al aplanarla en el lienzo final (fracción del
// cuadrado). Se usa para estimar el DPI y para dibujar el diseño en la imagen
// guardada; el editor 3D usa su propio ancho en unidades de mundo.
const ANCHO_IMAGEN_BASE = 0.38;

// Mockups base (foto de la prenda con fondo transparente) usados solo para
// componer la imagen final que se guarda como miniatura.
const IMAGENES_MOCKUP = {
  mug: pocilloFrente,
  mug_magico: pocilloFrente,
  jarra_cervecera: pocilloFrente,
};

const BASES_MOCKUP_POR_CARA = {
  mug: {
    frente: pocilloFrente,
    atras: pocilloAsa,
  },
  mug_magico: {
    frente: pocilloFrente,
    atras: pocilloAsa,
  },
  jarra_cervecera: {
    frente: pocilloFrente,
    atras: pocilloAsa,
  },
};

function obtenerBaseMockup(tipo, cara) {
  return (
    (cara && BASES_MOCKUP_POR_CARA[tipo]?.[cara]) ||
    IMAGENES_MOCKUP[tipo] ||
    pocilloFrente
  );
}

// Categoría del backend -> tipo de mockup interno del personalizador.
const TIPO_POR_CATEGORIA = {
  Mugs: "mug",
  Jarras: "jarra_cervecera",
};
const CATEGORIA_POR_TIPO = {
  mug: "Mugs",
  mug_magico: "Mugs",
  jarra_cervecera: "Jarras",
};

// Detección por nombre de producto para los 3 tipos nuevos (mug, mug_magico, jarra)
function detectarTipoPorNombre(nombre = "") {
  const n = String(nombre).toLowerCase();
  if (n.includes("jarra") || n.includes("cervecera") || n.includes("beer")) return "jarra_cervecera";
  if (n.includes("mágico") || n.includes("magico") || n.includes("mágica") || n.includes("magica")) return "mug_magico";
  return "mug";
}

// Ubicaciones del pocillo/mug: de frente y desde atrás (donde se ve el asa).
const CARAS_MUG = [
  { id: "frente", label: "Frente" },
  { id: "atras", label: "Atrás" },
];

const CARAS_POR_TIPO = {
  mug: CARAS_MUG,
  mug_magico: CARAS_MUG,
  jarra_cervecera: CARAS_MUG,
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
// BLEED_PX legacy para composiciones mockup; para print-ready vinculado al visor
// 3D se usa BLEED_PX_300DPI (3mm≈35px a 300DPI) de texturaPrenda.js
const BLEED_PX = 36;
const BLEED_PRINT_3D = BLEED_PX_300DPI; // 35px - extensión extra sin recortar contenido
// Margen seguro: lo que nunca se corta, aunque haya desalineación.
const MARGEN_SEGURO_PX = 80;

function calcularDpi(naturalWidth, anchoRenderizadoPx) {
  if (!naturalWidth || !anchoRenderizadoPx) return 0;
  const pulgadas = (anchoRenderizadoPx / TAMANO_LIENZO) * PRINT_WIDTH_INCHES;
  return pulgadas > 0 ? naturalWidth / pulgadas : 0;
}

// DPI efectivo de una imagen ya colocada, con su escala actual.
function dpiDeImagen(img) {
  const ancho =
    TAMANO_LIENZO * ANCHO_IMAGEN_BASE * (img.escala ?? 1);
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

  // Producto seleccionado en el personalizador (controla el mockup mostrado).
  // Si el usuario llega desde un producto concreto del catálogo, se preselecciona por nombre.
  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (productoOrigen?.nombre) return detectarTipoPorNombre(productoOrigen.nombre);
    return TIPO_POR_CATEGORIA[productoOrigen?.categoria] ?? "mug";
  });

  // Producto efectivo para guardar/carrito: si viene del catálogo se usa ese,
  // si no se resuelve uno real del backend según el tipo seleccionado (mug/mug_magico/jarra)
  // para que "Agregar al carrito" funcione sin obligar a pasar por catálogo.
  const [productoEfectivo, setProductoEfectivo] = useState(productoOrigen);
  const [cargandoProductoEfectivo, setCargandoProductoEfectivo] = useState(false);
  const precioBase = productoEfectivo?.precio ?? productoOrigen?.precio ?? 25000;

  useEffect(() => {
    // Si hay origen y coincide con el tipo seleccionado (por nombre o categoria), usarlo directo
    if (productoOrigen) {
      const tipoOrigen = productoOrigen?.nombre
        ? detectarTipoPorNombre(productoOrigen.nombre)
        : TIPO_POR_CATEGORIA[productoOrigen.categoria];
      if (tipoOrigen === selectedProduct) {
        setProductoEfectivo(productoOrigen);
        return;
      }
    }
    // Si no hay origen o se cambió de tipo, buscar en el backend un producto real de esa categoría
    let cancelado = false;
    setCargandoProductoEfectivo(true);
    listarProductos()
      .then((lista) => {
        if (cancelado) return;
        const categoriaBuscada = CATEGORIA_POR_TIPO[selectedProduct] ?? "Mugs";
        let candidatos = (Array.isArray(lista) ? lista : []).filter(
          (p) => p.categoria === categoriaBuscada && p.activo !== false
        );
        // Filtrar por nombre para distinguir mug / mug_magico / jarra_cervecera dentro de la misma categoría
        if (selectedProduct === "mug_magico") {
          candidatos = candidatos.filter((p) => {
            const n = String(p.nombre).toLowerCase();
            return n.includes("mágico") || n.includes("magico") || n.includes("mágica") || n.includes("magica");
          });
        } else if (selectedProduct === "jarra_cervecera") {
          candidatos = candidatos.filter((p) => {
            const n = String(p.nombre).toLowerCase();
            return n.includes("jarra") || n.includes("cervecera") || n.includes("beer");
          });
        } else if (selectedProduct === "mug") {
          candidatos = candidatos.filter((p) => {
            const n = String(p.nombre).toLowerCase();
            return !n.includes("mágico") && !n.includes("magico") && !n.includes("mágica") && !n.includes("magica") && !n.includes("jarra") && !n.includes("cervecera");
          });
        }
        // Preferir el más barato con stock, si no el primero
        const elegido =
          candidatos.sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0)).find((p) => (p.stock ?? 1) > 0) ??
          candidatos[0] ??
          null;
        if (elegido) setProductoEfectivo(elegido);
        else setProductoEfectivo(productoOrigen); // fallback aunque no coincida
      })
      .catch(() => {
        if (!cancelado) setProductoEfectivo(productoOrigen);
      })
      .finally(() => {
        if (!cancelado) setCargandoProductoEfectivo(false);
      });
    return () => { cancelado = true; };
  }, [selectedProduct, productoOrigen]);

  // Lista de imágenes insertadas (subidas, IA o plantillas). Cada una guarda la
  // cara de la prenda, su posición en coordenadas UV [0,1] (de la capa de
  // proyección 3D), la posición local del modelo (para el <Decal>), la rotación
  // (grados) y la escala. Se colocan/arrastran directamente sobre el modelo 3D.
  const [imagenes, setImagenes] = useState([]);
  // Imagen lista para colocar: cuando existe, el siguiente clic sobre el modelo
  // la coloca en ese punto (en vez de editarse en un lienzo 2D).
  const [imagenPendiente, setImagenPendiente] = useState(null); // { url, naturalWidth, naturalHeight }
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
  // Capas de texto tipo Canva: cada texto es un objeto independiente movible/escalable/rotatable
  const [capasTexto, setCapasTexto] = useState([]); // {id, contenido, color, fuente, tamano, negrita, cursiva, subrayado, x, y, rotacion, escala, cara}
  const [textoActivoId, setTextoActivoId] = useState(null);
  const [editorTextoMinimizado, setEditorTextoMinimizado] = useState(false);
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
  const [arrastrandoImagen, setArrastrandoImagen] = useState(false);
  const [dragPreview, setDragPreview] = useState(null); // preview durante arrastre para 60fps sin regenerar textura
  const arrastrandoRef = useRef(false);
  useEffect(() => { arrastrandoRef.current = arrastrandoImagen; }, [arrastrandoImagen]);

  // Galería de plantillas prediseñadas: se carga la primera vez que se abre
  // la pestaña y se filtra en cliente por categoría y compatibilidad.
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  const [errorPlantillas, setErrorPlantillas] = useState(null);
  const [categoriaPlantilla, setCategoriaPlantilla] = useState("todas");
  const plantillasCargadasRef = useRef(false);

  // Al seleccionar otro texto, des-minimizar el panel para mostrar herramientas
  useEffect(() => {
    if (textoActivoId) setEditorTextoMinimizado(false);
  }, [textoActivoId]);

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
  // Emojis de la cara activa (se dibujan en la imagen final guardada).
  const emojisEnCaraActiva = emojis.filter((e) => (e.cara ?? "frente") === caraActiva);

  const capasTextoEnCaraActiva = capasTexto.filter((t) => (t.cara ?? "frente") === caraActiva);
  const textoActivoLayer = capasTexto.find((t) => t.id === textoActivoId) ?? null;
  const hayDiseno = Boolean(
    imagenes.length || emojis.length || capasTexto.length || colorSeleccionado || textoDiseno.trim()
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

      // Plantillas: mugs y jarra con escala inicial mayor para que no se vean pequeñas
      const escalaPlantilla = selectedProduct === "jarra_cervecera" ? 1.4 : 1.35;
      await prepararImagenPendiente(url, escalaPlantilla);
      setMensaje({
        tipo: "ok",
        texto: `Plantilla "${plantilla.nombre}" lista. Haz clic sobre la prenda para colocarla (escala inicial ${Math.round(escalaPlantilla*100)}%, podrás agrandarla hasta ${ESCALA_MAX_3D*100}%).`,
      });
    } catch (err) {
      console.error("Error cargando la plantilla en el canvas:", err);
      setMensaje({
        tipo: "error",
        texto: "No fue posible aplicar la plantilla al lienzo.",
      });
    }
  };

  // Deja una imagen lista para colocar sobre el modelo 3D. Almacena sus
  // dimensiones naturales (para conservar el aspect ratio del Decal) y avisa
  // al usuario de que haga clic sobre la prenda.
  const prepararImagenPendiente = async (url, escalaSugerida = 1) => {
    let naturalWidth = 0;
    let naturalHeight = 0;
    try {
      const el = await cargarImagenElemento(url);
      if (el) {
        naturalWidth = el.naturalWidth;
        naturalHeight = el.naturalHeight;
      }
    } catch {
      // Sin dimensiones
    }
    // Deselecciona cualquier imagen/emoji/texto activo para que el siguiente
    // clic coloque la nueva imagen en vez de mover la seleccionada (bug
    // "no aplica la imagen" cuando había activa).
    setImagenActivaId(null);
    setEmojiActivoId(null);
    setTextoActivoId(null);
    setTextoActivo(false);
    setImagenPendiente({ url, naturalWidth, naturalHeight, escala: escalaSugerida });
    setMensaje({
      tipo: "ok",
      texto: "Haz clic sobre la prenda para colocar la imagen.",
    });
  };

  // Coloca la imagen pendiente en el punto donde el usuario hizo clic en el 3D.
  const colocarImagen = (ubicacion) => {
    if (!imagenPendiente) return;
    const { uv, posicion, cara } = ubicacion;
    const u = uv?.u ?? 0.5;
    const v = uv?.v ?? 0.5;
    const nueva = {
      id: crearIdImagen(),
      url: imagenPendiente.url,
      naturalWidth: imagenPendiente.naturalWidth ?? 0,
      naturalHeight: imagenPendiente.naturalHeight ?? 0,
      cara: cara ?? "frente",
      uv: { u, v },
      // x/y en % para compatibilidad con componerTexturaCamiseta / componerImagenFinal legacy
      x: u * 100,
      y: v * 100,
      posicion: posicion ?? [0, 0, 0.18],
      escala: imagenPendiente.escala ?? 1,
      rotacion: 0,
    };
    setImagenes((prev) => [...prev, nueva]);
    setImagenActivaId(nueva.id);
    setEmojiActivoId(null);
    setTextoActivoId(null);
    setTextoActivo(false);
    setImagenPendiente(null);
    setMensaje({
      tipo: "ok",
      texto: "Imagen colocada. Arrástrala, escálala o rótala desde el panel.",
    });
  };

  const actualizarImagen = (id, patch) => {
    setImagenes((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  // Actualiza la posición (UV + local) de una imagen durante el arrastre en 3D.
  // Durante el arrastre solo actualiza dragPreview (overlay 3D barato, 60fps
  // sin regenerar CanvasTexture). Al soltar se hace el commit real a imagenes
  // en alta calidad (512/1024 + 0.88 inset).
  const moverImagen = (id, ubicacion) => {
    if (arrastrandoRef.current) {
      setDragPreview({ id, ...ubicacion });
      return;
    }
    const patch = {};
    if (ubicacion.uv) {
      patch.uv = { u: ubicacion.uv.u, v: ubicacion.uv.v };
      patch.x = ubicacion.uv.u * 100;
      patch.y = ubicacion.uv.v * 100;
    }
    if (ubicacion.posicion) patch.posicion = ubicacion.posicion;
    if (ubicacion.cara) patch.cara = ubicacion.cara;
    setImagenes((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
  };

  const commitDragPreview = () => {
    if (!dragPreview?.id) return;
    const { id, uv, posicion, cara } = dragPreview;
    const patch = {};
    if (uv) {
      patch.uv = { u: uv.u, v: uv.v };
      patch.x = uv.u * 100;
      patch.y = uv.v * 100;
    }
    if (posicion) patch.posicion = posicion;
    if (cara) patch.cara = cara;
    setImagenes((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
    setDragPreview(null);
  };

  const seleccionarImagen = (id) => {
    setImagenActivaId(id);
    setEmojiActivoId(null);
    setTextoActivoId(null);
    if (id) {
      setTextoActivo(false);
      const img = imagenes.find((i) => i.id === id);
      if (img?.cara) setCaraActiva(img.cara);
    }
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
    setTextoActivoId(null);
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
    setTextoActivoId(null);
    if (id) setTextoActivo(false);
  };

  const eliminarEmoji = (id) => {
    setEmojis((prev) => prev.filter((e) => e.id !== id));
    setEmojiActivoId((actual) => (actual === id ? null : actual));
  };

  // --- Capas de texto Canva ---
  function crearIdTexto() {
    return `txt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  const agregarCapaTexto = () => {
    if (!textoDiseno.trim()) return;
    const id = crearIdTexto();
    const offset = desplazamientoAleatorio();
    const nueva = {
      id,
      contenido: textoDiseno.trim(),
      color: colorTexto,
      fuente: fuenteTexto,
      tamano: tamanoTexto,
      negrita: esNegrita,
      cursiva: esCursiva,
      subrayado: esSubrayado,
      x: 50 + offset * 0.6,
      y: 50 + offset * 0.6,
      rotacion: 0,
      escala: 1,
      cara: caraActiva,
    };
    setCapasTexto((prev) => [...prev, nueva]);
    setTextoActivoId(id);
    setTextoActivo(false);
    setImagenActivaId(null);
    setEmojiActivoId(null);
    setTextoDiseno("");
  };
  const actualizarCapaTexto = (id, patch) => {
    setCapasTexto((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const seleccionarCapaTexto = (id) => {
    setTextoActivoId(id);
    setImagenActivaId(null);
    setEmojiActivoId(null);
    setTextoActivo(false);
  };
  const eliminarCapaTexto = (id) => {
    setCapasTexto((prev) => prev.filter((t) => t.id !== id));
    setTextoActivoId((actual) => (actual === id ? null : actual));
  };
  // Movimiento directo sobre el buso/estampado (sin overlay): actualiza x/y vía UV del raycast
  const moverCapaTexto3D = (id, ubicacion) => {
    const patch = {};
    if (ubicacion.uv) { patch.x = ubicacion.uv.u * 100; patch.y = ubicacion.uv.v * 100; }
    if (ubicacion.cara) patch.cara = ubicacion.cara;
    actualizarCapaTexto(id, patch);
  };
  const moverEmoji3D = (id, ubicacion) => {
    const patch = {};
    if (ubicacion.uv) { patch.x = ubicacion.uv.u * 100; patch.y = ubicacion.uv.v * 100; }
    if (ubicacion.cara) patch.cara = ubicacion.cara;
    actualizarEmoji(id, patch);
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
    if (textoActivoId) {
      eliminarCapaTexto(textoActivoId);
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
  }, [imagenActivaId, emojiActivoId, textoActivoId, textoActivo]);

  useEffect(() => {
    const finArrastre = () => {
      if (dragPreview?.id) {
        const { id, uv, posicion, cara } = dragPreview;
        const patch = {};
        if (uv) {
          patch.uv = { u: uv.u, v: uv.v };
          patch.x = uv.u * 100;
          patch.y = uv.v * 100;
        }
        if (posicion) patch.posicion = posicion;
        if (cara) patch.cara = cara;
        setImagenes((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)));
        setDragPreview(null);
      }
      setArrastrandoImagen(false);
    };
    window.addEventListener("pointerup", finArrastre);
    window.addEventListener("pointercancel", finArrastre);
    return () => {
      window.removeEventListener("pointerup", finArrastre);
      window.removeEventListener("pointercancel", finArrastre);
    };
  }, [dragPreview]);

  // Coloca una imagen directamente en el centro de la cara activa (sin
  // requerir clic), usada para subidas múltiples donde sería tedioso pedir
  // un clic por imagen.
  const agregarImagenDirecta = async (url) => {
    let naturalWidth = 0;
    let naturalHeight = 0;
    try {
      const el = await cargarImagenElemento(url);
      if (el) {
        naturalWidth = el.naturalWidth;
        naturalHeight = el.naturalHeight;
      }
    } catch {
      // sin dimensiones
    }
    const offset = desplazamientoAleatorio() / 100;
    const u = Math.min(0.92, Math.max(0.08, 0.5 + offset));
    const v = Math.min(0.92, Math.max(0.08, 0.5 + offset));
    const nueva = {
      id: crearIdImagen(),
      url,
      naturalWidth,
      naturalHeight,
      cara: caraActiva,
      uv: { u, v },
      x: u * 100,
      y: v * 100,
      posicion: [0, 0, 0.18],
      escala: 1,
      rotacion: 0,
    };
    setImagenes((prev) => [...prev, nueva]);
    setImagenActivaId(nueva.id);
    setEmojiActivoId(null);
    setTextoActivoId(null);
    setTextoActivo(false);
  };

  // Procesa archivos de imagen (subida, paste, drop) para colocarlos en 3D
  const procesarArchivosImagen = async (archivos) => {
    if (!archivos.length) return;
    setProcesandoImagen(true);
    setMensaje(null);
    // Si son varios archivos, los agregamos directamente al centro con offset;
    // si es uno solo, lo dejamos pendiente para que el usuario elija dónde
    // hacer clic sobre el modelo (experiencia más precisa).
    const esMultiple = archivos.length > 1;
    for (const archivo of archivos) {
      let dataUrl = null;
      try {
        if (recorteInteligente) {
          const blob = await removeBackground(archivo);
          dataUrl = await blobToDataURL(blob);
        } else {
          dataUrl = await blobToDataURL(archivo);
        }
      } catch {
        // Fallback: usa el archivo original si removeBackground falla
        dataUrl = await new Promise((resolve) => {
          const lector = new FileReader();
          lector.onload = () => resolve(lector.result);
          lector.onerror = () => resolve(null);
          lector.readAsDataURL(archivo);
        });
      }
      if (!dataUrl) continue;
      if (esMultiple) {
        await agregarImagenDirecta(dataUrl);
      } else {
        await prepararImagenPendiente(dataUrl);
      }
    }
    setProcesandoImagen(false);
    if (esMultiple && archivos.length > 1) {
      setMensaje({ tipo: "ok", texto: `${archivos.length} imágenes agregadas. Selecciona una para moverla/escalarla.` });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubirImagen = async (e) => {
    const archivos = Array.from(e.target.files ?? []);
    await procesarArchivosImagen(archivos);
  };

  // Pegar con Ctrl+V: si el portapapeles trae imágenes (screenshot, copy-image),
  // se procesan igual que una subida para colocarlas en el modelo 3D
  useEffect(() => {
    const alPegar = async (e) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const archivosImagen = items
        .filter((it) => it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter(Boolean);
      // Fallback: files del clipboard (algunos navegadores)
      const filesFallback = Array.from(e.clipboardData?.files ?? []).filter((f) =>
        f.type.startsWith("image/")
      );
      const archivos = archivosImagen.length ? archivosImagen : filesFallback;
      if (!archivos.length) return;
      e.preventDefault();
      await procesarArchivosImagen(archivos);
      setMensaje({
        tipo: "ok",
        texto: "Imagen pegada. Haz clic sobre la prenda para colocarla en 3D.",
      });
    };
    window.addEventListener("paste", alPegar);
    return () => window.removeEventListener("paste", alPegar);
  }, [recorteInteligente]);

  const handleDropEnEditor = async (e) => {
    e.preventDefault();
    const archivos = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!archivos.length) return;
    await procesarArchivosImagen(archivos);
    setMensaje({
      tipo: "ok",
      texto: "Imagen soltada. Haz clic sobre la prenda para colocarla.",
    });
  };

  const handleDragOverEnEditor = (e) => {
    if (Array.from(e.dataTransfer?.types ?? []).includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
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
        productoId: productoEfectivo?.id ?? productoOrigen?.id ?? null,
      });

      const imagenUrl =
        resultado.imagenUrl ?? resultado.url ?? resultado.imagen ?? null;

      if (imagenUrl) {
        // El resultado de IA queda listo para colocar con un clic en el 3D.
        prepararImagenPendiente(imagenUrl);
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
    setImagenPendiente(null);
    setEmojis([]);
    setEmojiActivoId(null);
    setCapasTexto([]);
    setTextoActivoId(null);
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

  // Aplana la vista activa (producto + color) junto con las imágenes y el texto
  // en una sola imagen PNG para guardarla como miniatura en "Mis diseños" / el
  // carrito. La posición de cada imagen viene en coordenadas UV [0,1] (las
  // mismas que se guardan en el payload).
  const componerImagenFinal = async () => {
    if (!imagenes.length && !emojis.length && !capasTexto.length && !textoDiseno.trim()) return null;

    const canvas = document.createElement("canvas");
    canvas.width = TAMANO_LIENZO;
    canvas.height = TAMANO_LIENZO;
    const ctx = canvas.getContext("2d");

    // 1. Producto de fondo: misma imagen base de mockup que se usa en el
    //    visor (a alto completo del lienzo, centrada horizontalmente; si es
    //    más ancha que el cuadrado, se recorta por los lados).
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

    // 3. Diseños + texto en una capa aparte (mug no necesita desborde)
    const permitirDesborde = false;

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

      // Se utiliza directamente el aspect ratio natural sin multiplicar escalas duplicadas
      const baseW = TAMANO_LIENZO * ANCHO_IMAGEN_BASE * (imagen.escala ?? 1);
      const baseH = baseW * (el.naturalHeight / el.naturalWidth);
      // Posición en coordenadas UV [0,1]; si viniera de un diseño antiguo en
      // %, se usa ese valor como respaldo.
      const cx = (imagen.uv ? imagen.uv.u : (imagen.x ?? 50) / 100) * TAMANO_LIENZO;
      const cy = (imagen.uv ? imagen.uv.v : (imagen.y ?? 50) / 100) * TAMANO_LIENZO;

      ctxDiseno.save();
      ctxDiseno.translate(cx, cy);
      ctxDiseno.rotate(((imagen.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.drawImage(el, -baseW / 2, -baseH / 2, baseW, baseH);
      ctxDiseno.restore();
    }

    // Compatibilidad: capa legacy (textoDiseno) si existe y no hay capas Canva
    const capasTextoParaDibujar = capasTexto.length
      ? capasTexto.filter((t) => (t.cara ?? "frente") === caraActiva)
      : textoDiseno.trim()
        ? [
            {
              contenido: textoDiseno,
              color: colorTexto,
              fuente: fuenteTexto,
              tamano: tamanoTexto,
              negrita: esNegrita,
              cursiva: esCursiva,
              subrayado: esSubrayado,
              x: posicionTexto.x,
              y: posicionTexto.y,
              rotacion: rotacionTexto,
              escala: escalaTexto,
            },
          ]
        : [];
    for (const capa of capasTextoParaDibujar) {
      if (!capa.contenido?.trim()) continue;
      const peso = capa.negrita ? "800" : "400";
      const estiloFuente = capa.cursiva ? "italic " : "";
      await cargarFuenteParaCanvas(capa.fuente, { peso, estilo: estiloFuente });
      ctxDiseno.save();
      ctxDiseno.translate((capa.x / 100) * TAMANO_LIENZO, (capa.y / 100) * TAMANO_LIENZO);
      ctxDiseno.rotate(((capa.rotacion ?? 0) * Math.PI) / 180);
      ctxDiseno.scale(capa.escala ?? 1, capa.escala ?? 1);
      ctxDiseno.fillStyle = capa.color;
      ctxDiseno.font = `${estiloFuente}${peso} ${Math.round((capa.tamano ?? 32) * FACTOR_LIENZO)}px ${capa.fuente}`;
      ctxDiseno.textAlign = "center";
      ctxDiseno.textBaseline = "middle";
      ctxDiseno.fillText(capa.contenido, 0, 0);
      if (capa.subrayado) {
        const anchoTexto = ctxDiseno.measureText(capa.contenido).width;
        const tamDibujo = Math.round((capa.tamano ?? 32) * FACTOR_LIENZO);
        ctxDiseno.strokeStyle = capa.color;
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

  // --- PRINT-READY VINCULADO AL VISOR 3D ---
  // Config idéntica a la usada en Prenda3D.jsx/prepararModeloCamiseta/Mug para
  // garantizar paridad visual exacta. Cambiar aquí debe reflejar allí y viceversa.
  const CONFIG_SUPERFICIE_PRINT = {
    mug: {
      frente: { mapearTorso: false, conTexto: true, anchoBase: 0.22 },
      atras: { mapearTorso: false, conTexto: false, anchoBase: 0.22 },
    },
    mug_magico: {
      frente: { mapearTorso: false, conTexto: true, anchoBase: 0.22 },
      atras: { mapearTorso: false, conTexto: false, anchoBase: 0.22 },
    },
    jarra_cervecera: {
      frente: { mapearTorso: false, conTexto: true, anchoBase: 0.28 },
      atras: { mapearTorso: false, conTexto: false, anchoBase: 0.28 },
    },
  };

  function agruparDisenosPorCaraLocal(imagenesLista) {
    const CARAS_VALIDAS = ["frente", "atras"];
    const grupos = {};
    for (const d of imagenesLista ?? []) {
      const caraNorm = d.cara === "asa" ? "atras" : d.cara;
      const cara = CARAS_VALIDAS.includes(caraNorm) ? caraNorm : "frente";
      (grupos[cara] ??= []).push(d);
    }
    return grupos;
  }

  // Genera print-ready CILÍNDRICO RECTANGULAR (2362x1063 para mug 20x9cm a 300DPI)
  // Fórmula UV -> píxeles: pixelX = (u*100/100)*W , pixelY = (v*100/100)*H con W=2362 H=1063
  // SOLO capa del diseño con fondo transparente: sin sombras/brillos/cerámica del material 3D.
  // Lo que el usuario ve en el 3D (posición u,v y escala) coincide 1:1 con el lienzo 2D expandido.
  const componerImagenPrintReady = async (caraDestino = caraActiva) => {
    if (!imagenes.length && !emojis.length && !capasTexto.length && !textoDiseno.trim()) return null;

    const cfg = CONFIG_SUPERFICIE_PRINT[selectedProduct]?.[caraDestino] ?? CONFIG_SUPERFICIE_PRINT.mug.frente;
    const grupos = agruparDisenosPorCaraLocal(imagenes);
    const disenosCara = grupos[caraDestino] ?? [];

    // Reproduce exactamente la construcción de textosConfig del visor 3D
    const textosConfig = [];
    if (capasTexto.length) {
      for (const capa of capasTexto) {
        if ((capa.cara ?? "frente") !== caraDestino && cfg.conTexto) {
          if (caraDestino !== (capa.cara ?? "frente")) continue;
        }
        textosConfig.push({
          contenido: capa.contenido,
          color: capa.color,
          fuente: capa.fuente,
          tamano: capa.tamano,
          negrita: capa.negrita,
          cursiva: capa.cursiva,
          subrayado: capa.subrayado,
          x: capa.x,
          y: capa.y,
          rotacion: capa.rotacion,
          escala: capa.escala,
        });
      }
    } else if (textoDiseno && textoDiseno.trim()) {
      textosConfig.push({
        contenido: textoDiseno,
        color: colorTexto,
        fuente: fuenteTexto,
        tamano: tamanoTexto,
        negrita: esNegrita,
        cursiva: esCursiva,
        subrayado: esSubrayado,
        x: posicionTexto.x,
        y: posicionTexto.y,
        rotacion: rotacionTexto,
        escala: escalaTexto,
      });
    }
    for (const em of emojis ?? []) {
      // Solo emojis de la cara destino (el visor filtra por cara)
      if ((em.cara ?? "frente") !== caraDestino && cfg.conTexto) continue;
      textosConfig.push({
        contenido: em.emoji,
        color: "#000000",
        fuente: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
        tamano: em.tamano ?? 48,
        x: em.x,
        y: em.y,
        rotacion: em.rotacion ?? 0,
        escala: em.escala ?? 1,
      });
    }
    const textosCara = cfg.conTexto ? textosConfig : [];

    // Dimensiones según producto: mug 20x9cm (2362x1063), jarra 24x12cm (2835x1417) a 300 DPI
    const esJarra = selectedProduct === "jarra_cervecera";
    const anchoPrint = esJarra ? JARRA_PRINT_WIDTH_PX : MUG_PRINT_WIDTH_PX;
    const altoPrint = esJarra ? JARRA_PRINT_HEIGHT_PX : MUG_PRINT_HEIGHT_PX;

    // *** CLAVE: fondoTransparente 100% - solo diseño, sin cerámica/sombras/luces ***
    const { dataUrl } = await componerMugPrintReady({
      disenos: disenosCara,
      textos: textosCara,
      ancho: anchoPrint,
      alto: altoPrint,
      anchoBase: cfg.anchoBase,
      bleedPx: 0, // sublimación cilíndrica no necesita bleed extra; el rectángulo ya es el área completa
      agregarMarcasCorte: false,
    });
    return dataUrl;
  };

  // Versión que genera las 4 caras con contenido (cada una como archivo separado)
  // Para mantener simpleza, el botón actual exporta solo la cara activa; esta
  // función deja preparado el soporte para exportar todas si se necesita.
  const componerTodasCarasPrintReady = async () => {
    const caras = CARAS_POR_TIPO[selectedProduct] ?? CARAS_MUG;
    const resultados = [];
    const grupos = agruparDisenosPorCaraLocal(imagenes);
    // Texto global se evalúa por cara según conTexto
    for (const cara of caras) {
      const cfg = CONFIG_SUPERFICIE_PRINT[selectedProduct]?.[cara.id];
      if (!cfg) continue;
      const tieneDiseno = (grupos[cara.id]?.length ?? 0) > 0;
      const tieneTexto = cfg.conTexto && (textoDiseno.trim() || emojis.length > 0);
      if (!tieneDiseno && !tieneTexto) continue;
      const dataUrl = await componerImagenPrintReady(cara.id);
      if (dataUrl) resultados.push({ cara: cara.id, label: cara.label, dataUrl });
    }
    return resultados;
  };

  const handleDescargarPrintReady = async () => {
    if (!hayDiseno) {
      setMensaje({ tipo: "error", texto: "No hay diseño para exportar." });
      return;
    }
    setDescargandoPrint(true);
    try {
      const dataUrl = await componerImagenPrintReady(caraActiva);
      if (!dataUrl) {
        setMensaje({ tipo: "error", texto: "Esa cara no tiene contenido para imprimir." });
        return;
      }
      const esJarra = selectedProduct === "jarra_cervecera";
      const anchoPrint = esJarra ? JARRA_PRINT_WIDTH_PX : MUG_PRINT_WIDTH_PX;
      const altoPrint = esJarra ? JARRA_PRINT_HEIGHT_PX : MUG_PRINT_HEIGHT_PX;
      // Archivo print-ready rectangular transparente, solo diseño (sin sombras/cerámica)
      descargarDataUrl(dataUrl, `skd-print-${selectedProduct}-${caraActiva}-${anchoPrint}x${altoPrint}-300dpi.png`);
      const cmW = esJarra ? "24" : "20";
      const cmH = esJarra ? "12" : "9";
      setMensaje({ tipo: "ok", texto: `Print-ready ${anchoPrint}x${altoPrint}px (${cmW}x${cmH}cm a 300 DPI) descargado — fondo transparente, solo diseño, WYSIWYG con el visor 3D.` });
    } catch (e) {
      console.error("Error print-ready cilíndrico:", e);
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
    const productoParaGuardar = productoEfectivo ?? productoOrigen;
    if (!productoParaGuardar?.id) {
      setMensaje({ tipo: "error", texto: cargandoProductoEfectivo ? "Cargando producto, intenta de nuevo en un segundo..." : "No se encontró un producto para guardar. Ve al catálogo y elige uno." });
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
      await subirDiseno({ file, productoId: productoParaGuardar.id });
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
    const productoParaCarrito = productoEfectivo ?? productoOrigen;
    if (!productoParaCarrito?.id) {
      setMensaje({
        tipo: "error",
        texto: cargandoProductoEfectivo ? "Cargando producto, intenta de nuevo en un segundo..." : "No se encontró un producto para el carrito. Elige uno en el catálogo.",
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
      const item = await agregarProducto(productoParaCarrito);

      // Si el carrito devolvió el item, intentamos persistir la
      // personalización asociada (imagen aplanada + descripción).
      if (item?.id) {
        const notas = [
          `Producto: ${selectedProduct}`,
          imagenes.length
            ? `Imágenes: ${imagenes
                .map(
                  (img, i) =>
                    `#${i + 1} ${img.cara ?? "frente"} uv(${(
                      img.uv?.u ?? 0.5
                    ).toFixed(2)},${(img.uv?.v ?? 0.5).toFixed(2)}) escala ${(
                      img.escala ?? 1
                    ).toFixed(2)} rot ${img.rotacion ?? 0}°`
                )
                .join(" | ")}`
            : null,
          emojis.length ? `Emojis insertados: ${emojis.length}` : null,
          capasTexto.length
            ? `Textos Canva: ${capasTexto.map((t) => `"${t.contenido}" ${t.x.toFixed(0)}%,${t.y.toFixed(0)}% ${t.tamano}px ${buscarFuente(t.fuente)?.nombre ?? t.fuente}`).join(" | ")}`
            : null,
          colorSeleccionado ? `Color elegido: ${colorSeleccionado}` : null,
          !capasTexto.length && textoDiseno.trim()
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

  const carasProducto = CARAS_POR_TIPO[selectedProduct] ?? CARAS_MUG;

  const etiquetaCaraActiva =
    carasProducto.find((cara) => cara.id === caraActiva)?.label ?? "";

  // Al cambiar de producto las posiciones UV/3D de las imágenes ya no son
  // válidas (el modelo cambia), así que se limpia el diseño.
  const cambiarProducto = (tipo) => {
    setSelectedProduct(tipo);
    setCaraActiva("frente");
    setImagenes([]);
    setImagenActivaId(null);
    setImagenPendiente(null);
    setEmojis([]);
    setEmojiActivoId(null);
    setCapasTexto([]);
    setTextoActivoId(null);
    setTextoDiseno("");
    setTextoActivo(false);
    // Mug Mágico por defecto es negro/oscuro (#1a1a1a) como taza que cambia con calor
    if (tipo === "mug_magico") setColorSeleccionado("#1a1a1a");
    else setColorSeleccionado(null);
  };

  // Props compartidas del visor 3D interactivo (editor principal y modal).
  const props3D = {
    interactivo: true,
    tipo: selectedProduct,
    color: colorSeleccionado ?? (selectedProduct === "mug_magico" ? "#1a1a1a" : "#ffffff"),
    imagenes,
    imagenActivaId,
    imagenPendiente: imagenPendiente ? imagenPendiente.url : null,
    emojis,
    capasTexto,
    texto: textoDiseno,
    colorTexto,
    fuenteTexto,
    tamanoTexto,
    esNegrita,
    esCursiva,
    esSubrayado,
    posicionTexto,
    rotacionTexto,
    escalaTexto,
    onColocar: colocarImagen,
    onMover: moverImagen,
    onMoverTexto: moverCapaTexto3D,
    onMoverEmoji: moverEmoji3D,
    textoActivoId,
    emojiActivoId,
    onSeleccionar: seleccionarImagen,
    onSeleccionarTexto: seleccionarCapaTexto,
    onSeleccionarEmoji: seleccionarEmoji,
    caraCamara: caraActiva,
    arrastrandoImagen,
    onArrastrarImagen: setArrastrandoImagen,
    dragPreview,
  };

  return (
    <>
      <section className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Personaliza tu producto
        </h1>

        {productoOrigen ? (
          <p className="-mt-6 mb-6 text-sm text-gray-500 dark:text-slate-400">
            Personalizando: <strong>{productoOrigen.nombre}</strong> · {formatPrice(productoOrigen.precio)}
          </p>
        ) : productoEfectivo ? (
          <p className="-mt-6 mb-6 text-sm text-gray-500 dark:text-slate-400">
            Producto: <strong>{productoEfectivo.nombre}</strong> · {formatPrice(productoEfectivo.precio)}{" "}
            <span className="text-xs italic">(seleccionado automáticamente para {selectedProduct} — puedes cambiarlo arriba o ir al catálogo para elegir otro)</span>
          </p>
        ) : null}
        {cargandoProductoEfectivo && (
          <p className="-mt-4 mb-4 flex items-center gap-2 text-xs text-indigo-600 dark:text-cyan-300">
            <FaSpinner className="animate-spin" /> Cargando producto base para el carrito...
          </p>
        )}

        {/* Selector de producto - Mug / Mug Mágico / Jarra Cervecera */}
        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-slate-400">
            Elige el producto
          </p>
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => cambiarProducto("mug")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                selectedProduct === "mug"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/40"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <Coffee className="h-8 w-8" />
              <span className="font-semibold">Mug</span>
              <span className="text-xs opacity-70">Clásico 11oz</span>
            </button>
            <button
              type="button"
              onClick={() => cambiarProducto("mug_magico")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                selectedProduct === "mug_magico"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/40"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <FaMoon className="h-8 w-8" />
              <span className="font-semibold">Mug Mágico</span>
              <span className="text-xs opacity-70">Cambia con calor</span>
            </button>
            <button
              type="button"
              onClick={() => cambiarProducto("jarra_cervecera")}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition ${
                selectedProduct === "jarra_cervecera"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/40"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-500"
              }`}
            >
              <FaBeer className="h-8 w-8" />
              <span className="font-semibold">Jarra Cervecera</span>
              <span className="text-xs opacity-70">500ml</span>
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
                {/* Vistas de la prenda: al elegir una, la cámara del visor 3D
                    gira hacia esa cara automáticamente. */}
                <>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                    Vista de la prenda
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
                <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-slate-500">
                  O pega una imagen con <kbd className="rounded border border-gray-300 bg-gray-100 px-1 py-0.5 font-mono text-[10px] dark:border-slate-600 dark:bg-slate-800">Ctrl+V</kbd> / arrástrala al visor 3D
                </p>

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
                            onClick={() => seleccionarImagen(img.id)}
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

                        <p className="text-xs font-medium text-gray-500 dark:text-slate-400">
                          Ubicación:{" "}
                          {carasProducto.find((c) => c.id === caraDe(imagenActiva))
                            ?.label ?? "Frente"}
                          {imagenActiva.uv
                            ? ` · UV (${imagenActiva.uv.u.toFixed(2)}, ${imagenActiva.uv.v.toFixed(2)})`
                            : ""}
                        </p>

                        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
                          Tamaño:{" "}
                          {Math.round((imagenActiva.escala ?? 1) * 100)}%
                        </label>
                        <input
                          type="range"
                          min={ESCALA_MIN_3D}
                          max={ESCALA_MAX_3D}
                          step={0.05}
                          value={imagenActiva.escala ?? 1}
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            actualizarImagen(imagenActiva.id, {
                              escala: valor,
                            });
                          }}
                          className="w-full accent-indigo-600 dark:accent-cyan-500"
                        />
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">
                          Arrastra la imagen sobre la prenda para moverla; usa
                          este deslizador para escalarla.
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
                  Plantillas para {selectedProduct}
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
                {/* ===== MODO CANVA: Texto y Emojis como capas libres ===== */}
                <div className="mb-3 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-cyan-500/10">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-cyan-300">Modo Canva</p>
                  <p className="text-[11px] leading-tight text-indigo-600/80 dark:text-cyan-200/70">Cada texto es una capa independiente: se puede mover, agrandar y rotar directamente sobre la prenda.</p>
                </div>

                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                  Agregar texto
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textoDiseno}
                    onChange={(e) => setTextoDiseno(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarCapaTexto(); } }}
                    placeholder="Ej: Familia Pérez"
                    maxLength={40}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={agregarCapaTexto}
                    disabled={!textoDiseno.trim()}
                    className="shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-40 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                  >
                    Agregar
                  </button>
                </div>

                {/* Capas de texto creadas - lista Canva */}
                {capasTexto.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-slate-400">Capas de texto ({capasTexto.length}) · toca para editar</p>
                    <div className="space-y-2">
                      {capasTexto.map((capa) => (
                        <button
                          key={capa.id}
                          type="button"
                          onClick={() => seleccionarCapaTexto(capa.id)}
                          className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${capa.id === textoActivoId ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-500/10 dark:ring-cyan-500/40" : "border-gray-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900"}`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold dark:bg-slate-800" style={{ fontFamily: capa.fuente, color: capa.color }}>Aa</span>
                          <span className="min-w-0 flex-1 truncate text-sm" style={{ fontFamily: capa.fuente, color: capa.color, fontWeight: capa.negrita ? 800 : 400, fontStyle: capa.cursiva ? "italic" : "normal", textDecoration: capa.subrayado ? "underline" : "none" }}>{capa.contenido}</span>
                          <span className={`shrink-0 text-[10px] ${capa.cara === caraActiva ? "text-emerald-600" : "text-gray-400"}`}>{capasTexto.find(c=>c.id===capa.id)?.cara === caraActiva ? "● " : ""}{capasTexto.find(c=>c.id===capa.id)?.cara ?? "frente"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editor de la capa seleccionada - controles Canva */}
                {textoActivoLayer ? (
                  <div className="mt-4 space-y-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/50 p-3 dark:border-cyan-400 dark:bg-cyan-500/5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-indigo-700 dark:text-cyan-300">Editando: {textoActivoLayer.contenido.slice(0,18)}</p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditorTextoMinimizado((v) => !v)}
                          title={editorTextoMinimizado ? "Maximizar" : "Minimizar"}
                          className="rounded-lg border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {editorTextoMinimizado ? <FaExpand size={12} /> : <FaTimes size={12} style={{ transform: "rotate(45deg)" }} />}
                        </button>
                        <button type="button" onClick={() => eliminarCapaTexto(textoActivoLayer.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><FaTrash size={12} /></button>
                      </div>
                    </div>
                    {!editorTextoMinimizado && (
                      <>
                        <input
                          type="text"
                          value={textoActivoLayer.contenido}
                          onChange={(e) => actualizarCapaTexto(textoActivoLayer.id, { contenido: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        />
                        <label className="block text-xs text-gray-500">Color
                          <input type="color" value={normalizarHexParaPicker(textoActivoLayer.color) ?? "#111111"} onChange={(e) => actualizarCapaTexto(textoActivoLayer.id, { color: e.target.value })} className="mt-1 h-8 w-full cursor-pointer rounded border-none" />
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button type="button" aria-pressed={textoActivoLayer.negrita} onClick={() => actualizarCapaTexto(textoActivoLayer.id, { negrita: !textoActivoLayer.negrita })} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-bold transition ${textoActivoLayer.negrita ? "border-indigo-500 bg-indigo-600 text-white dark:bg-cyan-500 dark:border-cyan-400" : "border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700"}`}>B</button>
                          <button type="button" aria-pressed={textoActivoLayer.cursiva} onClick={() => actualizarCapaTexto(textoActivoLayer.id, { cursiva: !textoActivoLayer.cursiva })} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm italic transition ${textoActivoLayer.cursiva ? "border-indigo-500 bg-indigo-600 text-white dark:bg-cyan-500 dark:border-cyan-400" : "border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700"}`}>I</button>
                          <button type="button" aria-pressed={textoActivoLayer.subrayado} onClick={() => actualizarCapaTexto(textoActivoLayer.id, { subrayado: !textoActivoLayer.subrayado })} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm underline transition ${textoActivoLayer.subrayado ? "border-indigo-500 bg-indigo-600 text-white dark:bg-cyan-500 dark:border-cyan-400" : "border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700"}`}>U</button>
                          <button type="button" onClick={() => actualizarCapaTexto(textoActivoLayer.id, { rotacion: ((textoActivoLayer.rotacion ?? 0) + 45) % 360 })} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs dark:bg-slate-900 dark:border-slate-700" title="Rotar 45°"><FaSyncAlt size={10} /></button>
                        </div>
                        {/* Tamaño con minimizar/maximizar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-500">Tamaño {textoActivoLayer.tamano ?? 32}px</label>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => actualizarCapaTexto(textoActivoLayer.id, { tamano: Math.max(12, (textoActivoLayer.tamano ?? 32) - 2) })} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900" title="Minimizar">−</button>
                              <button type="button" onClick={() => actualizarCapaTexto(textoActivoLayer.id, { tamano: Math.min(80, (textoActivoLayer.tamano ?? 32) + 2) })} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-bold hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900" title="Maximizar">+</button>
                            </div>
                          </div>
                          <input type="range" min={12} max={80} step={2} value={textoActivoLayer.tamano ?? 32} onChange={(e) => actualizarCapaTexto(textoActivoLayer.id, { tamano: Number(e.target.value) })} className="w-full accent-indigo-600" />
                        </div>
                        <label className="block text-xs text-gray-500">Rotación {textoActivoLayer.rotacion ?? 0}°
                          <input type="range" min={0} max={360} step={5} value={textoActivoLayer.rotacion ?? 0} onChange={(e) => actualizarCapaTexto(textoActivoLayer.id, { rotacion: Number(e.target.value) })} className="w-full accent-indigo-600" />
                        </label>
                        <p className="text-[11px] text-gray-400">Arrástralo sobre el mug para moverlo. Usa −/+ para minimizar/maximizar.</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTextoActivoId(null);
                              setMensaje({ tipo: "ok", texto: "Texto guardado ✓" });
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                          >
                            <FaSave /> Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setTextoActivoId(null)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            <FaTimes /> Cerrar
                          </button>
                        </div>
                      </>
                    )}
                    {editorTextoMinimizado && (
                      <p className="text-[11px] text-gray-400">Minimizado — pulsa maximizar para editar.</p>
                    )}
                  </div>
                ) : capasTexto.length === 0 && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-center text-xs text-gray-400 dark:border-slate-700 dark:text-slate-500">Aún no hay capas. Escribe arriba y pulsa Agregar para crear tu primer texto movible.</div>
                )}

                {/* Selector de fuente para texto nuevo (y edición rápida) */}
                <label className="mb-2 mt-4 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Fuente para texto nuevo ({fuentesVisibles.length})
                </label>
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar fuente..."
                    value={busquedaFuente}
                    onChange={(e) => setBusquedaFuente(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <div className="grid max-h-36 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-gray-100 p-1.5 dark:border-slate-800">
                  {fuentesVisibles.slice(0, 20).map((fuente) => {
                    const activa = fuenteTexto === fuente.css;
                    return (
                      <button
                        key={fuente.id}
                        type="button"
                        onClick={() => {
                          setFuenteTexto(fuente.css);
                          if (textoActivoLayer) actualizarCapaTexto(textoActivoLayer.id, { fuente: fuente.css });
                        }}
                        style={{ fontFamily: fuente.css }}
                        className={`flex flex-col items-center justify-center rounded-lg border px-1 py-2 text-sm ${activa ? "border-indigo-500 bg-indigo-50 dark:bg-cyan-500/10" : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                      >
                        <span className="text-lg leading-none">Aa</span>
                        <span className="w-full truncate text-center text-[9px] text-gray-400">{fuente.nombre}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="my-4 border-t border-gray-200 dark:border-slate-800" />
                {/* Emojis Canva */}
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Emojis (capas movibles)
                </label>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {EMOJIS_RAPIDOS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => agregarEmoji(emoji)}
                      title="Agregar capa emoji movible"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-lg transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:hover:border-cyan-400"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {emojis.length > 0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-gray-500">Emojis en lienzo ({emojis.length}) · arrastra sobre la prenda</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {emojis.map((em) => (
                        <button
                          key={em.id}
                          type="button"
                          onClick={() => seleccionarEmoji(em.id)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg ${em.id === emojiActivoId ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 dark:bg-cyan-500/10" : "border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-950"}`}
                        >
                          {em.emoji}
                        </button>
                      ))}
                    </div>
                    {emojiActivo && (
                      <div className="space-y-3 rounded-xl border-2 border-indigo-500 bg-indigo-50/40 p-3 dark:border-cyan-400 dark:bg-cyan-500/5">
                        <p className="text-xs font-bold text-indigo-700 dark:text-cyan-300">Emoji seleccionado · arrástralo sobre el buso para mover</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => actualizarEmoji(emojiActivo.id, { rotacion: ((emojiActivo.rotacion ?? 0) + 45) % 360 })} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2 text-xs dark:bg-slate-900 dark:border-slate-700"><FaSyncAlt size={10} /> Rotar 45°</button>
                          <button type="button" onClick={() => eliminarEmoji(emojiActivo.id)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white py-2 text-xs text-red-500 dark:bg-slate-900"><FaTrash size={10} /> Eliminar</button>
                        </div>
                        <p className="text-[11px] text-gray-400">Tip: selecciona el emoji y arrástralo directamente sobre el buso para mover. Para agrandar usa el tamaño del próximo emoji antes de agregarlo.</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {herramienta !== "imagen" && (
              <p className="mt-5 border-t border-gray-200 pt-4 text-xs text-gray-400 dark:border-slate-800 dark:text-slate-500">
                Consejo: selecciona texto/emoji/imagen y arrástralo directamente sobre el buso para moverlo. Solo se ve una imagen pegada, sin capas flotantes arriba.
              </p>
            )}
          </div>

          {/* Editor 3D: las imágenes se colocan y arrastran directamente sobre
              el modelo. */}
          <div className="flex min-h-[560px] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400">
                Editor 3D · {etiquetaCaraActiva}
              </h2>
              {hayDiseno && (
                <button
                  type="button"
                  onClick={handleQuitarDiseno}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
                >
                  <FaTrash /> Quitar diseño
                </button>
              )}
            </div>

            <div
              className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800"
              onDragOver={handleDragOverEnEditor}
              onDrop={handleDropEnEditor}
            >
              {imagenPendiente && (
                <div className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow">
                  Haz clic sobre la prenda para colocar la imagen
                </div>
              )}
              <div
                className="h-full w-full"
                style={{ cursor: imagenPendiente ? "crosshair" : "default" }}
                onDragOver={handleDragOverEnEditor}
                onDrop={handleDropEnEditor}
              >
                <Prenda3D key={selectedProduct} {...props3D} />
              </div>
            </div>

            <p className="pt-3 text-center text-xs text-gray-400 dark:text-slate-500">
              {imagenPendiente
                ? "Haz clic en el modelo para colocar la imagen."
                : imagenActivaId || textoActivoId || emojiActivoId
                  ? "Arrastra sobre el buso para mover la capa seleccionada (texto/emoji/imagen)."
                  : "Gira el modelo. Selecciona texto/emoji/imagen en el panel y arrastra sobre el buso para mover."}
            </p>
          </div>

            {/* Acciones y resumen del diseño */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:w-[300px] lg:shrink-0">
              <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                Acciones
              </h2>

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

      {/* Lienzo maximizado: pantalla completa del editor 3D */}
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

          {imagenPendiente && (
            <p className="pb-2 text-center text-sm font-semibold text-cyan-300">
              Haz clic sobre la prenda para colocar la imagen.
            </p>
          )}

          <div className="flex flex-1 items-center justify-center px-6 pb-2">
            <div className="aspect-square w-full max-w-[560px]">
              <Prenda3D key={`modal-${selectedProduct}`} {...props3D} />
            </div>
          </div>

          <p className="pb-6 text-center text-sm text-slate-400">
            Arrastra para rotar · Haz clic para colocar o arrastra la imagen seleccionada
          </p>
        </div>
      )}
    </>
  );
}

export default Personalizador;
