import * as THREE from "three";

// Contorno de la camiseta (tipo "buzo") en unidades del mundo (caja de 2.6 x
// 2.6). Se usa tanto para la geometría extruida (grosor real con bisel) como
// para recortar el "decal" de los diseños a la silueta.
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

// Ancho base de cada imagen insertada (fracción del contenedor), igual que en
// PrendaMockup, para que la vista 3D coincida con el mockup 2D.
const ANCHO_IMAGEN_BASE = 0.38;

function cargarImagen(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Construye el contorno de la camiseta usando un objeto con las mismas
// operaciones de un path 2D (canvas) o un THREE.Shape, para no duplicar las
// coordenadas. El segmento entre el índice 6 y 7 es la curva del cuello.
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

// Devuelve un THREE.Shape con la silueta de la camiseta (para extruir).
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

// Dibuja el contorno de la camiseta sobre un canvas 2D (para recortar el decal).
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

// Dibuja el texto del personalizador en el canvas.
function dibujarTexto(ctx, texto, w, h) {
  if (!texto || !texto.contenido || !texto.contenido.trim()) return;

  const x = (texto.x / 100) * w;
  const y = (texto.y / 100) * h;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = texto.color || "#111111";
  ctx.font = `600 ${Math.round((texto.tamano || 32) * (w / 500))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto.contenido, 0, 0);
  ctx.restore();
}

// Textura "decal" para el frente de la camiseta: dibuja los diseños y el texto
// sobre un canvas transparente y luego recorta todo a la silueta de la prenda.
export async function componerTexturaDiseno(disenos, texto, { tamano = 512 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = tamano;
  canvas.height = tamano;
  const ctx = canvas.getContext("2d");

  for (const d of disenos ?? []) {
    let img;
    try {
      img = await cargarImagen(d.url, "anonymous");
    } catch {
      img = null;
    }
    if (!img) continue;

    const baseW = tamano * ANCHO_IMAGEN_BASE * (d.escala ?? 1);
    const baseH = baseW * (img.naturalHeight / img.naturalWidth);
    const cx = (d.x / 100) * tamano;
    const cy = (d.y / 100) * tamano;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();
  }

  dibujarTexto(ctx, texto, tamano, tamano);

  // Recorta a la silueta de la camiseta para que el diseño no se salga.
  ctx.globalCompositeOperation = "destination-in";
  dibujarContornoCamiseta(ctx, tamano);
  ctx.fill();

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}

// Textura para prendas cilíndricas (mug): cilindro de color sólido con los
// diseños dibujados encima. `disenos` (o `disenoUrl` para un único diseño) se
// pre-distorsionan para compensar el envolver del cilindro.
export async function componerTexturaSolida(color, disenoUrl, { anchoFraccion, circunferencia, altura, texto = null, disenos = null }) {
  const texW = 1024;
  const texH = 1024;

  const canvas = document.createElement("canvas");
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext("2d");

  // 1. Color sólido de la prenda (el color real elegido por el usuario).
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, texW, texH);

  // 2. Diseños, pre-distorsionados para compensar el envolver del cilindro.
  const dibujarUnDiseno = async (d, anchoFraccionPropio) => {
    let diseno;
    try {
      diseno = await cargarImagen(d.url, "anonymous");
    } catch {
      diseno = null;
    }
    if (!diseno) return;

    const aspect = diseno.naturalHeight / diseno.naturalWidth;
    const anchoFisico = anchoFraccionPropio * circunferencia;
    const altoFisico = anchoFisico * aspect;

    const dw = anchoFraccionPropio * texW;
    const dh = (altoFisico / altura) * texH;
    const cx = (d.x / 100) * texW;
    const cy = (d.y / 100) * texH;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(diseno, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };

  if (disenos && disenos.length) {
    for (const d of disenos) {
      await dibujarUnDiseno(d, ANCHO_IMAGEN_BASE * (d.escala ?? 1));
    }
  } else if (disenoUrl) {
    await dibujarUnDiseno(
      { url: disenoUrl, x: 50, y: 50, escala: 1, rotacion: 0 },
      anchoFraccion
    );
  }

  // 3. Texto del personalizador, dibujado encima del diseño.
  dibujarTexto(ctx, texto, texW, texH);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  return textura;
}
