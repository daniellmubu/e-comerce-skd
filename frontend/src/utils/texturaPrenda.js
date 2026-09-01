import * as THREE from "three";
import procesarDiseno from "./quitarFondoBlanco";
import { cargarFuenteParaCanvas } from "./fuentesTexto";

// Contorno de la camiseta en unidades del mundo (caja de 2.6 x 2.6).
const CAMISETA = {
  puntos: [
    [-0.95, -1.25],
    [-0.95, -0.15],
    [-1.3, 0.05],
    [-1.3, -0.5],
    [-0.95, -0.65],
    [-0.6, 0.85],
    [-0.28, 1.05],
    [0.28, 1.05],
    [0.6, 0.85],
    [0.95, -0.65],
    [1.3, -0.5],
    [1.3, 0.05],
    [0.95, -0.15],
    [0.95, -1.25],
  ],
  cuelloControl: [0, 0.75],
};

const ANCHO_IMAGEN_BASE = 0.38;
// Debe coincidir con ANCHO_IMAGEN_MUG de Prenda3D.jsx (tras ajuste 0.15→0.22)
export const ANCHO_IMAGEN_MUG_TEX = 0.22;

const AREA_IMPRIMIBLE_TORSO = {
  x0: 0.302,
  y0: 0.181,
  ancho: 0.398,
  alto: 0.636,
};

// --- Parámetros físicos para alta resolución print-ready (300 DPI) ---
// El visor usa 512px como textura base. Para 300 DPI reales sobre 12 pulgadas
// de ancho físico (PRINT_WIDTH_INCHES en Personalizador.jsx), la resolución
// alta es 3600px (12*300). Se expone como constante para que print-ready use
// la MISMA composición solo que escalada.
export const DPI_PRINT = 300;
export const PRINT_WIDTH_INCHES_TEX = 12; // debe coincidir con Personalizador.jsx
export const TAMANO_TEX_ALTA_RESOLUCION = Math.round(PRINT_WIDTH_INCHES_TEX * DPI_PRINT); // 3600
// Bleed 3mm a 300 DPI ≈ 35px (3/25.4*300)
export const BLEED_MM_DEFECTO = 3;
export const BLEED_PX_300DPI = Math.round((BLEED_MM_DEFECTO / 25.4) * DPI_PRINT); // 35

// --- Parámetros print-ready cilíndrico (mug 11oz) ---
// Un mug es un cilindro perfecto: el área de sublimación es un rectángulo
// panorámico 20cm x 9cm. A 300 DPI => 2362 x 1063 px.
// A diferencia de la camiseta (cuadrada 3600x3600), el mug usa rectángulo.
// Ver frontend/src/utils/texturaPrenda.js:2362x1063
export const MUG_PRINT_WIDTH_CM = 20;
export const MUG_PRINT_HEIGHT_CM = 9;
export const MUG_PRINT_WIDTH_PX = Math.round((MUG_PRINT_WIDTH_CM / 2.54) * DPI_PRINT); // 2362
export const MUG_PRINT_HEIGHT_PX = Math.round((MUG_PRINT_HEIGHT_CM / 2.54) * DPI_PRINT); // 1063
// Jarra cervecera 500ml es más grande: 24cm x 12cm aprox.
export const JARRA_PRINT_WIDTH_CM = 24;
export const JARRA_PRINT_HEIGHT_CM = 12;
export const JARRA_PRINT_WIDTH_PX = Math.round((JARRA_PRINT_WIDTH_CM / 2.54) * DPI_PRINT); // 2835
export const JARRA_PRINT_HEIGHT_PX = Math.round((JARRA_PRINT_HEIGHT_CM / 2.54) * DPI_PRINT); // 1417

const cacheImagenes = new Map(); // url -> Promise<HTMLImageElement>

function cargarImagen(src, crossOrigin) {
  // Cachea por URL para no recargar la misma imagen en cada frame del arrastre.
  // La promesa se comparte entre llamadas concurrentes (muy frecuente al arrastrar).
  const clave = `${src}::${crossOrigin ?? ""}`;
  if (cacheImagenes.has(clave)) return cacheImagenes.get(clave);

  const intentar = (conCors) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      if (conCors && crossOrigin) img.crossOrigin = crossOrigin;
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const promesa = (!crossOrigin || src?.startsWith("data:"))
    ? intentar(false)
    : intentar(true).catch(() => intentar(false));

  // Guarda en cache y limpia en error para permitir reintento
  promesa.catch(() => cacheImagenes.delete(clave));
  if (cacheImagenes.size > 80) {
    cacheImagenes.delete(cacheImagenes.keys().next().value);
  }
  cacheImagenes.set(clave, promesa);
  return promesa;
}

function construirContorno(p) {
  p.moveTo(CAMISETA.puntos[0][0], CAMISETA.puntos[0][1]);
  for (let i = 1; i < CAMISETA.puntos.length; i++) {
    const [x, y] = CAMISETA.puntos[i];
    if (i === 7) {
      p.quadraticCurveTo(CAMISETA.cuelloControl[0], CAMISETA.cuelloControl[1], x, y);
    } else {
      p.lineTo(x, y);
    }
  }
  p.closePath();
}

export function crearShapeCamiseta() {
  const shape = new THREE.Shape();
  construirContorno({
    moveTo: (x, y) => shape.moveTo(x, y),
    lineTo: (x, y) => shape.lineTo(x, y),
    quadraticCurveTo: (cx, cy, x, y) => shape.quadraticCurveTo(cx, cy, x, y),
    closePath: () => shape.closePath(),
  });
  return shape;
}

function dibujarContornoCamiseta(ctx, tamano) {
  const escala = tamano / 2.6;
  const cx = tamano / 2;
  const cy = tamano / 2;
  construirContorno({
    moveTo: (x, y) => ctx.moveTo(cx + x * escala, cy - y * escala),
    lineTo: (x, y) => ctx.lineTo(cx + x * escala, cy - y * escala),
    quadraticCurveTo: (cxp, cyp, x, y) =>
      ctx.quadraticCurveTo(cx + cxp * escala, cy - cyp * escala, cx + x * escala, cy - y * escala),
    closePath: () => ctx.closePath(),
  });
}

function mapearPorArea(x, y, tamano, area) {
  if (!area) {
    return { cx: (x / 100) * tamano, cy: (y / 100) * tamano, fx: 1, fy: 1 };
  }
  const fx = 1 / area.ancho;
  const fy = 1 / area.alto;
  return {
    cx: (x / 100 - area.x0) * fx * tamano,
    cy: (y / 100 - area.y0) * fy * tamano,
    fx,
    fy,
  };
}

async function dibujarTexto(ctx, texto, w, h, area = null) {
  if (!texto || !texto.contenido || !texto.contenido.trim()) return;

  const { cx, cy, fx } = mapearPorArea(texto.x, texto.y, w, area);

  const peso = texto.negrita ? "800" : "400";
  const estilo = texto.cursiva ? "italic " : "";
  await cargarFuenteParaCanvas(texto.fuente || "sans-serif", { peso, estilo });

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((texto.rotacion ?? 0) * Math.PI) / 180);
  ctx.scale(texto.escala ?? 1, texto.escala ?? 1);
  ctx.fillStyle = texto.color || "#111111";
  const tamDibujo = Math.round((texto.tamano || 32) * (w / 500) * fx);
  ctx.font = `${estilo}${peso} ${tamDibujo}px ${texto.fuente || "sans-serif"}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto.contenido, 0, 0);

  if (texto.subrayado) {
    const ancho = ctx.measureText(texto.contenido).width;
    ctx.strokeStyle = texto.color || "#111111";
    ctx.lineWidth = Math.max(2, tamDibujo * 0.08);
    ctx.beginPath();
    ctx.moveTo(-ancho / 2, tamDibujo * 0.45);
    ctx.lineTo(ancho / 2, tamDibujo * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

async function dibujarTextos(ctx, textos, w, h, area = null) {
  for (const config of textos ?? []) {
    await dibujarTexto(ctx, config, w, h, area);
  }
}

async function cargarDiseno(url) {
  if (!url) return null;
  try {
    const procesada = await procesarDiseno(url);
    return await cargarImagen(procesada?.dataUrl ?? url, "anonymous");
  } catch {
    return null;
  }
}

// Núcleo reutilizable: compone el canvas 2D con la MISMA lógica de posicionamiento
// que usa el visor 3D. Retorna el canvas para que el llamante decida si crea
// una THREE.CanvasTexture (visor) o un dataURL PNG de alta resolución (print-ready).
// Mantiene proporciones, posiciones relativas (mapearPorArea/AREA_IMPRIMIBLE_TORSO),
// escalas y rotaciones idénticas; solo cambia el tamaño del canvas.
async function componerCanvasCamisetaInterno({
  color = "#ffffff",
  disenos = [],
  texto = null,
  textos = null,
  tamano = 512,
  recortarSilueta = false,
  espejoX = false,
  espejoY = false,
  fondoTransparente = false,
  mapearTorso = false,
  anchoBase = ANCHO_IMAGEN_BASE,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = tamano;
  canvas.height = tamano;
  const ctx = canvas.getContext("2d");

  if (!fondoTransparente) {
    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(0, 0, tamano, tamano);
  } else {
    ctx.clearRect(0, 0, tamano, tamano);
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.save();
  if (recortarSilueta) {
    dibujarContornoCamiseta(ctx, tamano);
    ctx.clip();
  }

  ctx.save();
  if (espejoX || espejoY) {
    ctx.translate(espejoX ? tamano : 0, espejoY ? tamano : 0);
    ctx.scale(espejoX ? -1 : 1, espejoY ? -1 : 1);
  }

  const area = mapearTorso ? AREA_IMPRIMIBLE_TORSO : null;

  for (const d of disenos ?? []) {
    const img = await cargarDiseno(d.url);
    if (!img) continue;

    const aspectRatio = img.naturalHeight / img.naturalWidth;
    const INSET = 0.88;
    let baseW = tamano * anchoBase * (d.escala ?? 1) * INSET;
    let baseH = baseW * aspectRatio;
    // Corrección cilíndrica para mug: la textura 512×512 mapea circ≈6.91 a ancho
    // y altura≈2.0 a alto → 1px horizontal = 3.45× más ancho físico que vertical.
    // Sin esto el diseño se ve muy ancho (estirado). Se compensa haciendo
    // baseH más alta para que el rectángulo físico quede proporcional.
    const esMug = anchoBase === ANCHO_IMAGEN_MUG_TEX;
    if (esMug) {
      const FACTOR_CILINDRICO = (2 * Math.PI * 1.1) / 2.0; // ≈3.4558
      baseH *= FACTOR_CILINDRICO;
      // Limita ancho excesivo en apaisadas y alto excesivo al agrandar mucho
      // (evita "muy ancho" y que a escala 4.5x el alto se salga del canvas).
      const MAX_ANCHO_MUG = tamano * 0.42;
      const MAX_ALTO_MUG = tamano * 0.88;
      if (baseW > MAX_ANCHO_MUG || baseH > MAX_ALTO_MUG) {
        const ratio = Math.min(MAX_ANCHO_MUG / baseW, MAX_ALTO_MUG / baseH);
        baseW *= ratio;
        baseH *= ratio;
      }
    }

    const { cx, cy, fx, fy } = mapearPorArea(d.x, d.y, tamano, area);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, (-baseW * fx) / 2, (-baseH * fy) / 2, baseW * fx, baseH * fy);
    ctx.strokeStyle = "rgba(0,0,0,0.09)";
    ctx.lineWidth = Math.max(1, tamano * 0.003);
    ctx.strokeRect((-baseW * fx) / 2, (-baseH * fy) / 2, baseW * fx, baseH * fy);
    ctx.restore();
  }

  const listaTextos = textos ?? (texto ? [texto] : []);
  await dibujarTextos(ctx, listaTextos, tamano, tamano, area);
  ctx.restore();
  ctx.restore();

  return canvas;
}

export async function componerTexturaCamiseta(opts) {
  const canvas = await componerCanvasCamisetaInterno(opts);
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.premultiplyAlpha = false;
  textura.wrapS = THREE.ClampToEdgeWrapping;
  textura.wrapT = THREE.ClampToEdgeWrapping;
  textura.anisotropy = 4;
  textura.needsUpdate = true;
  // Punto 2 del checklist: material transparente para que el fondo del canvas
  // (ahora transparente) no oculte el color base del mug.
  // La propiedad se setea en Prenda3D.jsx al aplicar la textura; aquí solo
  // se marca como transparent-friendly.
  return textura;
}

// --- Alta resolución + bleed para print-ready, REUTILIZANDO la misma composición ---
// Genera el MISMO canvas que el visor pero a tamaño alta resolución (ej 3600px para
// 30x40cm a 300 DPI) escalando TODO proporcionalmente, y luego añade bleed configurable
// (por defecto 3mm ≈35px a 300 DPI) como espacio extra en los bordes SIN mover ni
// recortar el contenido del usuario.
export async function componerTexturaCamisetaAltaResolucion({
  tamanoAltaResolucion = TAMANO_TEX_ALTA_RESOLUCION,
  bleedPx = BLEED_PX_300DPI,
  agregarMarcasCorte = true,
  ...opts
}) {
  const tamano = tamanoAltaResolucion;
  const canvasAlta = await componerCanvasCamisetaInterno({ ...opts, tamano });

  if (!bleedPx || bleedPx <= 0) {
    return { canvas: canvasAlta, dataUrl: canvasAlta.toDataURL("image/png"), tamano, bleedPx: 0 };
  }

  const sizeConBleed = tamano + bleedPx * 2;
  const canvasBleed = document.createElement("canvas");
  canvasBleed.width = sizeConBleed;
  canvasBleed.height = sizeConBleed;
  const ctx = canvasBleed.getContext("2d");

  // Bleed: rellena bordes con el color base o transparente según fondoTransparente
  if (opts.fondoTransparente) {
    ctx.clearRect(0, 0, sizeConBleed, sizeConBleed);
  } else {
    ctx.fillStyle = opts.color || "#ffffff";
    ctx.fillRect(0, 0, sizeConBleed, sizeConBleed);
  }
  // Dibuja el canvas de alta resolución centrado dentro del bleed
  ctx.drawImage(canvasAlta, bleedPx, bleedPx);

  if (agregarMarcasCorte) {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = Math.max(2, tamano * 0.0007);
    const m = Math.round(tamano * 0.006); // largo de marca ~18px a 512 escalado a 3600
    const b = bleedPx;
    const s = sizeConBleed;
    ctx.beginPath(); ctx.moveTo(b, m); ctx.lineTo(b, b); ctx.lineTo(m, b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s - m, b); ctx.lineTo(s - b, b); ctx.lineTo(s - b, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b, s - m); ctx.lineTo(b, s - b); ctx.lineTo(m, s - b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s - b, s - m); ctx.lineTo(s - b, s - b); ctx.lineTo(s - m, s - b); ctx.stroke();
  }

  return { canvas: canvasBleed, dataUrl: canvasBleed.toDataURL("image/png"), tamano, bleedPx, tamanoConBleed: sizeConBleed };
}

// Helper para obtener canvas sin envolver en textura (útil para mug u otros)
export async function componerCanvasCamiseta(opts) {
  return componerCanvasCamisetaInterno(opts);
}

// ========================================================================
// PRINT-READY CILÍNDRICO RECTANGULAR (mug / jarra)
// ========================================================================
// Fórmula de mapeo UV -> píxeles para cilindro desplegado:
//
//   El modelo 3D usa UVs cilíndricas: u = 0.5 + atan2(x,z)/(2π) ∈ [0,1] (vuelta)
//   v = (y - minY)/altura ∈ [0,1] (alto). En Personalizador.jsx se guarda
//   d.x = u*100, d.y = v_invertida*100 donde v_invertida = 1 - uv_geom.y
//   (corrección por flipY de CanvasTexture).
//
//   Para lienzo rectangular plano W x H (ej. 2362x1063):
//     pixelX = (d.x / 100) * W   // u * W
//     pixelY = (d.y / 100) * H   // (1 - v_geom) * H  -> coincide con lo que ve el usuario
//     anchoDibujo  = W * anchoBase * escala * INSET
//     altoDibujo   = anchoDibujo * aspectRatio * FACTOR_CILINDRICO_RECT
//       donde FACTOR_CILINDRICO_RECT = (circ/altura) / (W/H)  corrige que 1px horizontal
//       no equivale físicamente a 1px vertical. Para square W/H=1 factor=3.4558 (igual que visor);
//       para 2362x1063 factor≈1.556.
//
//   El archivo exportado SOLO contiene la capa del diseño con fondo transparente:
//   ctx.clearRect(0,0,W,H) sin fill de color cerámica, sin luces/sombras del material 3D.
//   Así la máquina de sublimación recibe solo tintas donde hay diseño.
//
async function componerCanvasMugRectangularInterno({
  disenos = [],
  textos = [],
  ancho = MUG_PRINT_WIDTH_PX,
  alto = MUG_PRINT_HEIGHT_PX,
  anchoBase = ANCHO_IMAGEN_MUG_TEX,
}) {
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  // Fondo 100% transparente: solo diseño, sin cerámica/sombras/brillos del 3D
  ctx.clearRect(0, 0, ancho, alto);

  const INSET = 0.88;
  // Factor cilíndrico corregido para rectángulo: (circ/altura) / (W/H)
  const FACTOR_CILINDRICO_BASE = (2 * Math.PI * 1.1) / 2.0; // 3.4558 para square
  const factorRect = FACTOR_CILINDRICO_BASE / (ancho / alto);

  for (const d of disenos ?? []) {
    const img = await cargarDiseno(d.url);
    if (!img) continue;
    const aspectRatio = img.naturalHeight / img.naturalWidth;
    let baseW = ancho * anchoBase * (d.escala ?? 1) * INSET;
    let baseH = baseW * aspectRatio * factorRect;

    // Límites proporcionales al rectángulo (evita que a escala 4.5x se salga)
    const MAX_ANCHO = ancho * 0.90;
    const MAX_ALTO = alto * 0.90;
    if (baseW > MAX_ANCHO || baseH > MAX_ALTO) {
      const ratio = Math.min(MAX_ANCHO / baseW, MAX_ALTO / baseH);
      baseW *= ratio;
      baseH *= ratio;
    }

    // Mapeo UV -> píxeles rectangular (WYSIWYG con el visor 3D)
    const cx = (d.x / 100) * ancho;
    const cy = (d.y / 100) * alto;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
  }

  // Textos: dibujado directo en coordenadas de lienzo rectangular
  // Reusa lógica de dibujarTexto pero adaptada a W x H no cuadrado
  for (const texto of textos ?? []) {
    if (!texto?.contenido?.trim()) continue;
    const peso = texto.negrita ? "800" : "400";
    const estilo = texto.cursiva ? "italic " : "";
    await cargarFuenteParaCanvas(texto.fuente || "sans-serif", { peso, estilo });
    const cx = (texto.x / 100) * ancho;
    const cy = (texto.y / 100) * alto;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((texto.rotacion ?? 0) * Math.PI) / 180);
    ctx.scale(texto.escala ?? 1, texto.escala ?? 1);
    ctx.fillStyle = texto.color || "#111111";
    // Escala de fuente proporcional a ancho (2362 vs 512 del visor)
    const tamDibujo = Math.round((texto.tamano || 32) * (ancho / 512));
    ctx.font = `${estilo}${peso} ${tamDibujo}px ${texto.fuente || "sans-serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto.contenido, 0, 0);
    if (texto.subrayado) {
      const w = ctx.measureText(texto.contenido).width;
      ctx.strokeStyle = texto.color || "#111111";
      ctx.lineWidth = Math.max(2, tamDibujo * 0.08);
      ctx.beginPath();
      ctx.moveTo(-w / 2, tamDibujo * 0.45);
      ctx.lineTo(w / 2, tamDibujo * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  return canvas;
}

export async function componerMugPrintReady({
  disenos = [],
  textos = [],
  ancho = MUG_PRINT_WIDTH_PX,
  alto = MUG_PRINT_HEIGHT_PX,
  anchoBase = ANCHO_IMAGEN_MUG_TEX,
  bleedPx = 0,
  agregarMarcasCorte = false,
} = {}) {
  const canvasBase = await componerCanvasMugRectangularInterno({ disenos, textos, ancho, alto, anchoBase });

  if (!bleedPx || bleedPx <= 0) {
    return { canvas: canvasBase, dataUrl: canvasBase.toDataURL("image/png"), ancho, alto, bleedPx: 0 };
  }

  // Bleed rectangular transparente (no se rellena con color cerámica)
  const wBleed = ancho + bleedPx * 2;
  const hBleed = alto + bleedPx * 2;
  const canvasBleed = document.createElement("canvas");
  canvasBleed.width = wBleed;
  canvasBleed.height = hBleed;
  const ctx = canvasBleed.getContext("2d");
  ctx.clearRect(0, 0, wBleed, hBleed);
  ctx.drawImage(canvasBase, bleedPx, bleedPx);

  if (agregarMarcasCorte) {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    const m = Math.round(Math.min(ancho, alto) * 0.012);
    const b = bleedPx;
    ctx.beginPath(); ctx.moveTo(b, m); ctx.lineTo(b, b); ctx.lineTo(m, b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wBleed - m, b); ctx.lineTo(wBleed - b, b); ctx.lineTo(wBleed - b, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b, hBleed - m); ctx.lineTo(b, hBleed - b); ctx.lineTo(m, hBleed - b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wBleed - b, hBleed - m); ctx.lineTo(wBleed - b, hBleed - b); ctx.lineTo(wBleed - m, hBleed - b); ctx.stroke();
  }

  return { canvas: canvasBleed, dataUrl: canvasBleed.toDataURL("image/png"), ancho, alto, bleedPx, anchoConBleed: wBleed, altoConBleed: hBleed };
}

// ========================================================================
// VISTA PREVIA CON MOCKUP (mismo WxH y mismas capas que print-ready,
// pero compuesta SOBRE la foto/silueta del vaso de esa cara)
// ========================================================================
// Reutiliza 100% la lógica de capas: componerCanvasMugRectangularInterno
// (x/100*W, y/100*H, anchoBase*escala*INSET, factorRect, rotación).
// Solo añade debajo: fondo blanco + imagen mockup centrada con `contain`
// (como Panel2D con object-contain) + tinte opcional multiply.
const ZOOM_MOCKUP_PREVIEW = {
  // Debe coincidir con ZOOM_MOCKUP de Editor2D.jsx — bbox 24% frente necesita 1.75x, 51% laterales 1.30x
  mug: { frente: 1.75, izquierda: 1.30, derecha: 1.30 },
  mug_magico: { frente: 1.75, izquierda: 1.30, derecha: 1.30 },
  jarra_cervecera: { frente: 1.85, izquierda: 1.55, derecha: 1.55 },
};

export async function componerMugMockupPreview({
  disenos = [],
  textos = [],
  ancho = MUG_PRINT_WIDTH_PX,
  alto = MUG_PRINT_HEIGHT_PX,
  anchoBase = ANCHO_IMAGEN_MUG_TEX,
  mockupUrl = null,
  colorProducto = null,
  cara = "frente",
  selectedProduct = "mug",
} = {}) {
  const canvasDiseno = await componerCanvasMugRectangularInterno({ disenos, textos, ancho, alto, anchoBase });

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");

  // Fondo blanco igual que Panel2D (bg-white)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);

  if (mockupUrl) {
    try {
      const mockupImg = await cargarImagen(mockupUrl, "anonymous");
      const zoom = ZOOM_MOCKUP_PREVIEW[selectedProduct]?.[cara] ?? 1;
      const escala = Math.min(ancho / mockupImg.naturalWidth, alto / mockupImg.naturalHeight) * zoom;
      const dw = mockupImg.naturalWidth * escala;
      const dh = mockupImg.naturalHeight * escala;
      const dx = (ancho - dw) / 2;
      const dy = (alto - dh) / 2;

      if (colorProducto) {
        // Mockup + tinte multiply recortado a la silueta (source-in),
        // igual que componerImagenFinal / Panel2D (opacity 0.18).
        const tmp = document.createElement("canvas");
        tmp.width = ancho;
        tmp.height = alto;
        const tctx = tmp.getContext("2d");
        tctx.drawImage(mockupImg, dx, dy, dw, dh);
        tctx.globalCompositeOperation = "source-in";
        tctx.fillStyle = colorProducto;
        tctx.fillRect(0, 0, ancho, alto);
        // Dibujar mockup base y luego tinte con multiply
        ctx.drawImage(mockupImg, dx, dy, dw, dh);
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.18;
        ctx.drawImage(tmp, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      } else {
        ctx.drawImage(mockupImg, dx, dy, dw, dh);
      }
    } catch {
      // Si falla la carga del mockup, se deja solo fondo blanco + diseño
    }
  }

  // Capa de diseño transparente encima, con posiciones idénticas al print-ready
  ctx.drawImage(canvasDiseno, 0, 0);

  return { canvas, dataUrl: canvas.toDataURL("image/png"), ancho, alto };
}

export async function componerTexturaSolida(color, disenoUrl, { anchoFraccion, circunferencia, altura, texto = null, textos = null, disenos = null, fondoTransparente = null }) {
  const texW = 512;
  const texH = 512;

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d");

  // Punto 1 del checklist: canvas transparente para mug (sin fill sólido) cuando hay diseño.
  // Si fondoTransparente===true (mug overlay) se limpia transparente; si null se decide
  // automáticamente: transparente cuando hay contenido, sólido solo sin contenido.
  // Esto evita el rectángulo gris que cortaba la imagen del colibrí.
  const tieneContenido = (disenos && disenos.length > 0) || Boolean(disenoUrl) || (textos && textos.length > 0) || Boolean(texto && texto.trim());
  const usarTransparente = fondoTransparente !== null ? fondoTransparente : tieneContenido;
  if (usarTransparente) {
    ctx.clearRect(0, 0, texW, texH);
  } else {
    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(0, 0, texW, texH);
  }

  const dibujarUnDiseno = async (d, anchoFraccionPropio) => {
    const diseno = await cargarDiseno(d.url);
    if (!diseno) return;

    const aspect = diseno.naturalHeight / diseno.naturalWidth;
    const escX = d.escalaX ?? d.escala ?? 1;
    const escY = d.escalaY ?? d.escala ?? 1;

    const anchoFisico = anchoFraccionPropio * escX * circunferencia;
    const altoFisico = d.escalaY 
      ? anchoFraccionPropio * escY * altura 
      : anchoFisico * aspect;

    let dw = (anchoFisico / circunferencia) * texW;
    let dh = (altoFisico / altura) * texH;
    // Punto 3: evita recorte vertical en canvas cilíndrico cuadrado.
    // Para mug, dw/dh crudos pueden quedar muy anchos/pequeños; se usa la
    // misma corrección que en componerCanvasCamisetaInterno pero aquí el
    // canvas es siempre 512×512 físico, por lo que se limita proporcionalmente.
    // Si la imagen completa no cabe (ej escala 4.5x), se escala uniformemente
    // para que quepa sin recortarse, manteniendo el fondo transparente.
    const MAX_DW = texW * 0.45;
    const MAX_DH = texH * 0.90;
    if (dw > MAX_DW || dh > MAX_DH) {
      const r = Math.min(MAX_DW / dw, MAX_DH / dh);
      dw *= r;
      dh *= r;
    }
    const cx = (d.x / 100) * texW;
    const cy = (d.y / 100) * texH;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    const INSET_MUG = 0.88;
    ctx.drawImage(diseno, -dw * INSET_MUG / 2, -dh * INSET_MUG / 2, dw * INSET_MUG, dh * INSET_MUG);
    // Borde sutil solo si hay fondo transparente (evita rectángulo gris visible)
    if (usarTransparente) {
      ctx.strokeStyle = "rgba(0,0,0,0.07)";
      ctx.lineWidth = Math.max(1, texW * 0.003);
      ctx.strokeRect(-dw * INSET_MUG / 2, -dh * INSET_MUG / 2, dw * INSET_MUG, dh * INSET_MUG);
    }
    ctx.restore();
  };

  if (disenos && disenos.length) {
    for (const d of disenos) {
      await dibujarUnDiseno(d, ANCHO_IMAGEN_BASE);
    }
  } else if (disenoUrl) {
    await dibujarUnDiseno(
      { url: disenoUrl, x: 50, y: 50, escala: 1, rotacion: 0 },
      anchoFraccion
    );
  }

  const listaTextos = textos ?? (texto ? [texto] : []);
  await dibujarTextos(ctx, listaTextos, texW, texH);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.premultiplyAlpha = false;
  textura.wrapS = THREE.ClampToEdgeWrapping;
  textura.wrapT = THREE.ClampToEdgeWrapping;
  textura.anisotropy = 4;
  textura.needsUpdate = true;
  return textura;
}