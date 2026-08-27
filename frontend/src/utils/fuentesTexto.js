// Catálogo de tipografías disponibles para el texto del personalizador.
// Las familias web (Google Fonts) se cargan en index.html; cada entrada
// incluye alternativas del sistema como fallback para dibujos en canvas
// y uso sin conexión.

export const FUENTES_TEXTO = [
  {
    id: "clasica",
    nombre: "Clásica",
    categoria: "basicas",
    css: "Arial, Helvetica, sans-serif",
  },
  {
    id: "roboto",
    nombre: "Roboto",
    categoria: "basicas",
    css: '"Roboto", Arial, sans-serif',
  },
  {
    id: "georgia",
    nombre: "Georgia",
    categoria: "basicas",
    css: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "oswald",
    nombre: "Oswald",
    categoria: "condensadas",
    css: '"Oswald", "Arial Narrow", sans-serif',
  },
  {
    id: "bebas",
    nombre: "Bebas Neue",
    categoria: "condensadas",
    css: '"Bebas Neue", Impact, sans-serif',
  },
  {
    id: "anton",
    nombre: "Anton",
    categoria: "condensadas",
    css: '"Anton", Impact, sans-serif',
  },
  {
    id: "playfair",
    nombre: "Playfair",
    categoria: "elegantes",
    css: '"Playfair Display", Georgia, serif',
  },
  {
    id: "merriweather",
    nombre: "Merriweather",
    categoria: "elegantes",
    css: '"Merriweather", Georgia, serif',
  },
  {
    id: "dancing",
    nombre: "Dancing Script",
    categoria: "elegantes",
    css: '"Dancing Script", "Segoe Script", cursive',
  },
  {
    id: "lobster",
    nombre: "Lobster",
    categoria: "divertidas",
    css: '"Lobster", "Comic Sans MS", cursive',
  },
  {
    id: "pacifico",
    nombre: "Pacifico",
    categoria: "divertidas",
    css: '"Pacifico", "Brush Script MT", cursive',
  },
  {
    id: "bangers",
    nombre: "Bangers",
    categoria: "divertidas",
    css: '"Bangers", Impact, fantasy',
  },
  {
    id: "marker",
    nombre: "Marker",
    categoria: "divertidas",
    css: '"Permanent Marker", "Comic Sans MS", cursive',
  },
  {
    id: "fredoka",
    nombre: "Fredoka",
    categoria: "divertidas",
    css: '"Fredoka", "Trebuchet MS", sans-serif',
  },
  {
    id: "righteous",
    nombre: "Righteous",
    categoria: "retro",
    css: '"Righteous", "Trebuchet MS", sans-serif',
  },
  {
    id: "pressstart",
    nombre: "Pixel",
    categoria: "retro",
    css: '"Press Start 2P", monospace',
  },
  {
    id: "opensans",
    nombre: "Open Sans",
    categoria: "basicas",
    css: '"Open Sans", Arial, sans-serif',
  },
  {
    id: "montserrat",
    nombre: "Montserrat",
    categoria: "basicas",
    css: '"Montserrat", Arial, sans-serif',
  },
  {
    id: "poppins",
    nombre: "Poppins",
    categoria: "basicas",
    css: '"Poppins", Arial, sans-serif',
  },
  {
    id: "cinzel",
    nombre: "Cinzel",
    categoria: "elegantes",
    css: '"Cinzel", Georgia, serif',
  },
];

// Fuente aplicada por defecto (equivalente al sans-serif anterior).
export const FUENTE_TEXTO_DEFECTO = FUENTES_TEXTO[0].css;

export const CATEGORIAS_FUENTE = [
  { id: "todas", label: "Todas" },
  { id: "basicas", label: "Básicas" },
  { id: "condensadas", label: "Condensadas" },
  { id: "elegantes", label: "Elegantes" },
  { id: "divertidas", label: "Divertidas" },
  { id: "retro", label: "Retro" },
];

export function buscarFuente(css) {
  return FUENTES_TEXTO.find((f) => f.css === css) ?? null;
}

// El canvas solo puede dibujar una fuente web si ya terminó de descargar;
// esto fuerza su carga (usando el mismo peso con el que se dibuja) y espera.
export async function cargarFuenteParaCanvas(familia) {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await document.fonts.load(`600 32px ${familia}`, "Aa");
  } catch {
    // Sin soporte o sin conexión: se usará el fallback de la pila.
  }
}
