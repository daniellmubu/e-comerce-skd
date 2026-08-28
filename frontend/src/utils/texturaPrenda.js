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

const AREA_IMPRIMIBLE_TORSO = {
  x0: 0.302,
  y0: 0.181,
  ancho: 0.398,
  alto: 0.636,
};

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

  await cargarFuenteParaCanvas(texto.fuente || "sans-serif");

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((texto.rotacion ?? 0) * Math.PI) / 180);
  ctx.scale(texto.escala ?? 1, texto.escala ?? 1);
  ctx.fillStyle = texto.color || "#111111";
  
  const peso = texto.negrita ? "700" : "600";
  const estilo = texto.cursiva ? "italic " : "";
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

export async function componerTexturaCamiseta({
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
    // Inset 12% + borde sutil para romper efecto "pegado" sin shadowBlur costoso.
    // El inset deja aire respecto a costuras y el borde fino separa visualmente.
    const INSET = 0.88;
    const baseW = tamano * anchoBase * (d.escala ?? 1) * INSET;
    const baseH = baseW * aspectRatio;

    const { cx, cy, fx, fy } = mapearPorArea(d.x, d.y, tamano, area);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, (-baseW * fx) / 2, (-baseH * fy) / 2, baseW * fx, baseH * fy);
    // Borde muy sutil (1px) para que no se confunda con la tela, barato y sin blur
    ctx.strokeStyle = "rgba(0,0,0,0.09)";
    ctx.lineWidth = Math.max(1, tamano * 0.003);
    ctx.strokeRect((-baseW * fx) / 2, (-baseH * fy) / 2, baseW * fx, baseH * fy);
    ctx.restore();
  }

  const listaTextos = textos ?? (texto ? [texto] : []);
  await dibujarTextos(ctx, listaTextos, tamano, tamano, area);
  ctx.restore();
  ctx.restore();

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.premultiplyAlpha = false;
  textura.wrapS = THREE.ClampToEdgeWrapping;
  textura.wrapT = THREE.ClampToEdgeWrapping;
  textura.anisotropy = 4;
  textura.needsUpdate = true;
  return textura;
}

export async function componerTexturaSolida(color, disenoUrl, { anchoFraccion, circunferencia, altura, texto = null, textos = null, disenos = null }) {
  const texW = 512;
  const texH = 512;

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, texW, texH);

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

    const dw = (anchoFisico / circunferencia) * texW;
    const dh = (altoFisico / altura) * texH;
    const cx = (d.x / 100) * texW;
    const cy = (d.y / 100) * texH;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    // Inset 12% + borde sutil, sin blur para mantener nitidez y performance
    const INSET_MUG = 0.88;
    ctx.drawImage(diseno, -dw * INSET_MUG / 2, -dh * INSET_MUG / 2, dw * INSET_MUG, dh * INSET_MUG);
    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = Math.max(1, texW * 0.003);
    ctx.strokeRect(-dw * INSET_MUG / 2, -dh * INSET_MUG / 2, dw * INSET_MUG, dh * INSET_MUG);
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