const UMBRAL_BLANCO = 235;
const TOLERANCIA_COLOR = 30;

function colorDistancia(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export default async function procesarDiseno(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const idx = (x, y) => (y * width + x) * 4;

  // 1. Revisa las 4 esquinas: si no son blancas, la IA probablemente
  //    generó un mockup completo en vez de solo el gráfico.
  const esquinas = [idx(0, 0), idx(width - 1, 0), idx(0, height - 1), idx(width - 1, height - 1)];
  const esquinasBlancas = esquinas.every(
    (i) => data[i] > UMBRAL_BLANCO && data[i + 1] > UMBRAL_BLANCO && data[i + 2] > UMBRAL_BLANCO
  );

  if (!esquinasBlancas) {
    return { ok: false, dataUrl: url };
  }

  // 2. "Inundación" desde las esquinas: solo vuelve transparente el fondo
  //    CONECTADO a las esquinas, sin tocar blancos que estén dentro del
  //    dibujo (como los ojos o el moño de Hello Kitty).
  const visitado = new Uint8Array(width * height);
  const pila = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const colorRef = [data[0], data[1], data[2]];

  while (pila.length) {
    const [x, y] = pila.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const pos = y * width + x;
    if (visitado[pos]) continue;
    const i = pos * 4;
    const dist = colorDistancia(data[i], data[i + 1], data[i + 2], colorRef[0], colorRef[1], colorRef[2]);
    if (dist > TOLERANCIA_COLOR) continue;

    visitado[pos] = 1;
    data[i + 3] = 0;
    pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // 3. Si después de quitar el fondo blanco queda demasiado contenido opaco
  //    (la IA generó un mockup completo de la prenda en vez de solo el
  //    gráfico), lo marcamos como inválido para pedir regenerar.
  let opacos = 0;
  const total = width * height;
  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] > 0) opacos++;
  }
  if (opacos / total > 0.6) {
    return { ok: false, dataUrl: url };
  }

  ctx.putImageData(imageData, 0, 0);
  return { ok: true, dataUrl: canvas.toDataURL("image/png") };
}