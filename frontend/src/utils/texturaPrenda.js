import * as THREE from "three";
import camisetaBase from "../assets/images/products/base/camiseta-base.png";
import mugBase from "../assets/images/products/base/mug-base.png";

const IMAGENES = {
  camiseta: camisetaBase,
  mug: mugBase,
};

// Misma posición relativa del diseño que usa el Generador para el overlay CSS.
const OVERLAY = {
  camiseta: { top: 0.33, width: 0.5 },
  mug: { top: 0.35, width: 0.58 },
};

function cargarImagen(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Dibuja el texto del personalizador en el canvas. `texto` trae contenido,
// color, tamaño, posición (en %), rotación y escala; se usa el mismo criterio
// que el mockup 2D para que la vista 3D coincida.
function dibujarTexto(ctx, texto, w, h) {
  if (!texto || !texto.contenido || !texto.contenido.trim()) return;

  const x = (texto.x / 100) * w;
  const y = (texto.y / 100) * h;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((texto.rotacion || 0) * Math.PI) / 180);
  ctx.scale(texto.escala || 1, texto.escala || 1);
  ctx.fillStyle = texto.color || "#111111";
  ctx.font = `600 ${texto.tamano || 32}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto.contenido, 0, 0);
  ctx.restore();
}

// Dibuja la prenda completa (base + color + diseño) en un canvas y la devuelve
// como textura de three.js. `recortar` recorta el diseño a la silueta de la
// prenda (necesario para prendas planas como la camiseta).
export async function componerTextura(tipo, color, disenoUrl, { recortar = false, texto = null } = {}) {
  const base = await cargarImagen(IMAGENES[tipo]);

  let diseno = null;
  if (disenoUrl) {
    try {
      diseno = await cargarImagen(disenoUrl, "anonymous");
    } catch {
      diseno = null;
    }
  }

  const w = base.naturalWidth || 500;
  const h = base.naturalHeight || 500;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // 1. La foto real del producto, en blanco/gris.
  ctx.drawImage(base, 0, 0, w, h);

  // 2. Capa de color en "multiply", recortada a la silueta de la base para que
  //    el fondo transparente no se vuelva opaco (equivale al maskImage CSS).
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = w;
  colorCanvas.height = h;
  const cctx = colorCanvas.getContext("2d");
  cctx.fillStyle = color;
  cctx.fillRect(0, 0, w, h);
  cctx.globalCompositeOperation = "destination-in";
  cctx.drawImage(base, 0, 0, w, h);

  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(colorCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // 3. Diseño generado por la IA, centrado encima.
  if (diseno) {
    const config = OVERLAY[tipo] ?? { top: 0.35, width: 0.58 };
    const dw = w * config.width;
    const dh = dw * (diseno.naturalHeight / diseno.naturalWidth);
    const dx = (w - dw) / 2;
    const dy = h * config.top;

    if (recortar) {
      const disenoCanvas = document.createElement("canvas");
      disenoCanvas.width = w;
      disenoCanvas.height = h;
      const dctx = disenoCanvas.getContext("2d");
      dctx.drawImage(diseno, dx, dy, dw, dh);
      dctx.globalCompositeOperation = "destination-in";
      dctx.drawImage(base, 0, 0, w, h);
      ctx.drawImage(disenoCanvas, 0, 0);
    } else {
      ctx.drawImage(diseno, dx, dy, dw, dh);
    }
  }

  // 4. Texto del personalizador, dibujado encima del diseño.
  dibujarTexto(ctx, texto, w, h);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

// Textura para prendas cilíndricas (mug): cilindro de color sólido con
// el diseño dibujado encima. A diferencia de la foto, no hay distorsión ni
// fondo transparente. `anchoFraccion` es qué parte de la circunferencia ocupa
// el diseño; `circunferencia` y `altura` (en unidades del mundo) se usan para
// pre-distorsionar el diseño y que al envolverse se vea con su proporción real.
export async function componerTexturaSolida(color, disenoUrl, { anchoFraccion, circunferencia, altura, texto = null }) {
  const texW = 1024;
  const texH = 1024;

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d");

  // 1. Color sólido de la prenda (el color real elegido por el usuario).
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, texW, texH);

  // 2. Diseño centrado, pre-distorsionado para compensar el envolver del cilindro.
  if (disenoUrl) {
    let diseno;
    try {
      diseno = await cargarImagen(disenoUrl, "anonymous");
    } catch {
      diseno = null;
    }

    if (diseno) {
      const aspect = diseno.naturalHeight / diseno.naturalWidth;
      const anchoFisico = anchoFraccion * circunferencia;
      const altoFisico = anchoFisico * aspect;

      const dw = anchoFraccion * texW;
      const dh = (altoFisico / altura) * texH;
      const dx = (texW - dw) / 2;
      const dy = (texH - dh) / 2;

      ctx.drawImage(diseno, dx, dy, dw, dh);
    }
  }

  // 3. Texto del personalizador, dibujado encima del diseño.
  dibujarTexto(ctx, texto, texW, texH);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}
