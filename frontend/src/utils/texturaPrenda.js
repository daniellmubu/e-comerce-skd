import * as THREE from "three";
import procesarDiseno from "./quitarFondoBlanco";
import { cargarFuenteParaCanvas } from "./fuentesTexto";

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

// El editor 2D coloca el diseño en un contenedor CUADRADO (x/y = % del cuadrado),
// mientras que la textura 3D del torso solo cubre la zona de la camiseta dentro
// de ese cuadrado. Este rectángulo describe el torso dentro del cuadrado 2D
// (fracciones) para re-mapear posición y tamaño del diseño y que el estampado se
// vea igual de grande y en el mismo sitio que en el editor.
//
// Valores medidos sobre camiseta-base.png (recorte al cuadrado central) y el
// modelo tshirt.gltf normalizado: el torso mide ~63.5% del ancho y ~96% del alto
// de la camiseta completa.
const AREA_IMPRIMIBLE_TORSO = {
  x0: 0.302, // borde izquierdo del torso (fracción del cuadrado)
  y0: 0.181, // borde superior del torso (fracción del cuadrado)
  ancho: 0.398, // ancho del torso (fracción del cuadrado)
  alto: 0.636, // alto del torso (fracción del cuadrado)
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

// Convierte una coordenada del editor 2D (x/y en % del contenedor cuadrado) al
// rectángulo de impresión dentro del lienzo de la textura. Devuelve el centro
// (cx/cy) en px y los factores de escala fx/fy para ancho y alto del contenido.
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

// Dibuja el texto del personalizador en el canvas. Aplica la misma cadena de
// transformaciones (trasladar → rotar → escalar) que el editor 2D y la imagen
// final guardada, para que las tres vistas coincidan. `area` re-mapea las
// coordenadas al rectángulo imprimible del torso (solo camiseta frente/espalda).
// Espera la descarga de la fuente web elegida: sin esto, el canvas dibujaría
// con el fallback mientras el editor 2D ya muestra la fuente real.
async function dibujarTexto(ctx, texto, w, h, area = null) {
  if (!texto || !texto.contenido || !texto.contenido.trim()) return;

  const { cx, cy, fx } = mapearPorArea(texto.x, texto.y, w, area);

  await cargarFuenteParaCanvas(texto.fuente || "sans-serif");

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((texto.rotacion ?? 0) * Math.PI) / 180);
  ctx.scale(texto.escala ?? 1, texto.escala ?? 1);
  ctx.fillStyle = texto.color || "#111111";
  // Formato: peso (negrita), estilo (cursiva) y subrayado (línea manual).
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

// Dibuja una lista de configs de texto (texto principal + emojis como capas
// independientes), cada uno con su propia posición/escala/rotación/tamaño.
async function dibujarTextos(ctx, textos, w, h, area = null) {
  for (const config of textos ?? []) {
    await dibujarTexto(ctx, config, w, h, area);
  }
}

// Carga un diseño igual que se ve en el editor 2D: con el fondo blanco
// conectado a las esquinas vuelto transparente (procesarDiseno). Sin esto, en
// 3D se veía la caja blanca alrededor del diseño mientras el editor no.
async function cargarDiseno(url) {
  if (!url) return null;
  try {
    // procesarDiseno nunca rechaza: devuelve { ok:false, dataUrl:url } si no
    // aplica (o falló), así que siempre hay URL utilizable.
    const procesada = await procesarDiseno(url);
    return await cargarImagen(procesada?.dataUrl ?? url, "anonymous");
  } catch {
    return null;
  }
}

// Textura completa para la prenda: rellena con el color elegido y dibuja
// encima los diseños y el texto (sin tintarlos). Al ser opaca evita el problema
// de los píxeles transparentes (RGB negro) que oscurecían la prenda al
// multiplicarse con material.color.
//
// espejoX/espejoY compensan modelos cuyos UVs están invertidos respecto a los
// ejes del mundo (detectado por correlación posición↔UV en Prenda3D): se dibuja
// todo el contenido espejado para que en el modelo se vea derecho y en la misma
// posición que en el editor 2D.
export async function componerTexturaCamiseta({
  color = "#ffffff",
  disenos = [],
  texto = null,
  textos = null,
  tamano = 1024,
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

  // 1. Color sólido base de toda la prenda. En capas de proyección (frente,
  //    espalda, mangas) se deja el fondo TRANSPARENTE: se limpia el lienzo y
  //    no se pinta ningún color, para que el decal conserve el canal alpha y
  //    solo el estampado sea opaco. Cualquier fillRect aquí produciría el
  //    recuadro sólido (gris/blanco) alrededor del diseño en el modelo 3D.
  if (!fondoTransparente) {
    ctx.fillStyle = color || "#ffffff";
    ctx.fillRect(0, 0, tamano, tamano);
  } else {
    ctx.clearRect(0, 0, tamano, tamano);
    ctx.globalCompositeOperation = "source-over";
  }

  // 2. Diseños + texto, opcionalmente recortados a la silueta del torso.
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

    const baseW = tamano * anchoBase * (d.escalaX ?? d.escala ?? 1);
    const baseH =
      baseW *
      (img.naturalHeight / img.naturalWidth) *
      (d.escalaY ?? d.escala ?? 1);
    const { cx, cy, fx, fy } = mapearPorArea(d.x, d.y, tamano, area);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((d.rotacion ?? 0) * Math.PI) / 180);
    ctx.drawImage(img, (-baseW * fx) / 2, (-baseH * fy) / 2, baseW * fx, baseH * fy);
    ctx.restore();
  }

  // Texto + emojis: `textos` (lista de capas) tiene prioridad; `texto` se
  // mantiene para llamadas de un único texto (compatibilidad).
  const listaTextos = textos ?? (texto ? [texto] : []);
  await dibujarTextos(ctx, listaTextos, tamano, tamano, area);
  ctx.restore();
  ctx.restore();

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  // El canvas usa alpha no-premultiplicado (RGBA estándar); dejar el flag en
  // false evita que los píxeles transparentes se interpreten como sólidos.
  textura.premultiplyAlpha = false;
  textura.needsUpdate = true;
  return textura;
}

// Textura para prendas cilíndricas (mug): cilindro de color sólido con los
// diseños dibujados encima. `disenos` (o `disenoUrl` para un único diseño) se
// pre-distorsionan para compensar el envolver del cilindro.
export async function componerTexturaSolida(color, disenoUrl, { anchoFraccion, circunferencia, altura, texto = null, textos = null, disenos = null }) {
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
    const diseno = await cargarDiseno(d.url);
    if (!diseno) return;

    const aspect = diseno.naturalHeight / diseno.naturalWidth;
    const anchoFisico = anchoFraccionPropio * (d.escalaX ?? d.escala ?? 1) * circunferencia;
    const altoFisico = anchoFisico * aspect * (d.escalaY ?? d.escala ?? 1);

    const dw = anchoFisico / circunferencia * texW;
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
      // La escala del usuario se aplica dentro de dibujarUnDiseno; aquí solo
      // pasa el ancho base para no multiplicarla dos veces.
      await dibujarUnDiseno(d, ANCHO_IMAGEN_BASE);
    }
  } else if (disenoUrl) {
    await dibujarUnDiseno(
      { url: disenoUrl, x: 50, y: 50, escala: 1, rotacion: 0 },
      anchoFraccion
    );
  }

  // 3. Texto + emojis del personalizador, dibujados encima del diseño como
  //    capas independientes (`textos` tiene prioridad; `texto` es un único
  //    texto para compatibilidad).
  const listaTextos = textos ?? (texto ? [texto] : []);
  await dibujarTextos(ctx, listaTextos, texW, texH);

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.premultiplyAlpha = false;
  textura.needsUpdate = true;
  return textura;
}
