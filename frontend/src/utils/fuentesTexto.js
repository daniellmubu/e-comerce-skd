// Catálogo de tipografías disponibles para el texto del personalizador.
// Las familias web (Google Fonts) se cargan en index.html; cada entrada
// incluye alternativas del sistema como fallback para dibujos en canvas
// y uso sin conexión.

export const FUENTES_TEXTO = [
  // Básicas
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
    id: "lato",
    nombre: "Lato",
    categoria: "basicas",
    css: '"Lato", Arial, sans-serif',
  },
  {
    id: "nunito",
    nombre: "Nunito",
    categoria: "basicas",
    css: '"Nunito", Arial, sans-serif',
  },
  {
    id: "quicksand",
    nombre: "Quicksand",
    categoria: "basicas",
    css: '"Quicksand", Arial, sans-serif',
  },
  {
    id: "inter",
    nombre: "Inter",
    categoria: "basicas",
    css: '"Inter", Arial, sans-serif',
  },
  {
    id: "outfit",
    nombre: "Outfit",
    categoria: "basicas",
    css: '"Outfit", Arial, sans-serif',
  },
  {
    id: "ubuntu",
    nombre: "Ubuntu",
    categoria: "basicas",
    css: '"Ubuntu", Arial, sans-serif',
  },
  {
    id: "comfortaa",
    nombre: "Comfortaa",
    categoria: "basicas",
    css: '"Comfortaa", Arial, sans-serif',
  },
  // Condensadas / Display condensado
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
    id: "teko",
    nombre: "Teko",
    categoria: "condensadas",
    css: '"Teko", "Arial Narrow", sans-serif',
  },
  {
    id: "staatliches",
    nombre: "Staatliches",
    categoria: "condensadas",
    css: '"Staatliches", Impact, sans-serif',
  },
  {
    id: "amatic",
    nombre: "Amatic SC",
    categoria: "condensadas",
    css: '"Amatic SC", "Arial Narrow", cursive',
  },
  // Elegantes / Serif
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
    id: "cinzel",
    nombre: "Cinzel",
    categoria: "elegantes",
    css: '"Cinzel", Georgia, serif',
  },
  {
    id: "abril",
    nombre: "Abril Fatface",
    categoria: "elegantes",
    css: '"Abril Fatface", Georgia, serif',
  },
  {
    id: "greatvibes",
    nombre: "Great Vibes",
    categoria: "elegantes",
    css: '"Great Vibes", "Segoe Script", cursive',
  },
  {
    id: "dancing",
    nombre: "Dancing Script",
    categoria: "elegantes",
    css: '"Dancing Script", "Segoe Script", cursive',
  },
  {
    id: "patua",
    nombre: "Patua One",
    categoria: "elegantes",
    css: '"Patua One", Georgia, serif',
  },
  {
    id: "alfa",
    nombre: "Alfa Slab One",
    categoria: "elegantes",
    css: '"Alfa Slab One", Georgia, serif',
  },
  // Divertidas / Handwritten
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
    id: "chewy",
    nombre: "Chewy",
    categoria: "divertidas",
    css: '"Chewy", "Comic Sans MS", cursive',
  },
  {
    id: "luckiest",
    nombre: "Luckiest Guy",
    categoria: "divertidas",
    css: '"Luckiest Guy", Impact, cursive',
  },
  {
    id: "bungee",
    nombre: "Bungee",
    categoria: "divertidas",
    css: '"Bungee", Impact, sans-serif',
  },
  {
    id: "baloo",
    nombre: "Baloo 2",
    categoria: "divertidas",
    css: '"Baloo 2", "Comic Sans MS", cursive',
  },
  // Manuscritas
  {
    id: "satisfy",
    nombre: "Satisfy",
    categoria: "manuscritas",
    css: '"Satisfy", "Brush Script MT", cursive',
  },
  {
    id: "caveat",
    nombre: "Caveat",
    categoria: "manuscritas",
    css: '"Caveat", "Segoe Script", cursive',
  },
  {
    id: "shadows",
    nombre: "Shadows Into Light",
    categoria: "manuscritas",
    css: '"Shadows Into Light", "Segoe Script", cursive',
  },
  {
    id: "indie",
    nombre: "Indie Flower",
    categoria: "manuscritas",
    css: '"Indie Flower", "Comic Sans MS", cursive',
  },
  {
    id: "courgette",
    nombre: "Courgette",
    categoria: "manuscritas",
    css: '"Courgette", "Segoe Script", cursive',
  },
  {
    id: "kalam",
    nombre: "Kalam",
    categoria: "manuscritas",
    css: '"Kalam", "Comic Sans MS", cursive',
  },
  {
    id: "architects",
    nombre: "Architects Daughter",
    categoria: "manuscritas",
    css: '"Architects Daughter", "Comic Sans MS", cursive',
  },
  // Retro / Display
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
    id: "titan",
    nombre: "Titan One",
    categoria: "retro",
    css: '"Titan One", Impact, sans-serif',
  },
  {
    id: "monoton",
    nombre: "Monoton",
    categoria: "retro",
    css: '"Monoton", Impact, cursive',
  },
  {
    id: "creepster",
    nombre: "Creepster",
    categoria: "retro",
    css: '"Creepster", Impact, cursive',
  },
  {
    id: "blackops",
    nombre: "Black Ops One",
    categoria: "retro",
    css: '"Black Ops One", Impact, sans-serif',
  },
  // Futuristas / Tecnológicas
  {
    id: "orbitron",
    nombre: "Orbitron",
    categoria: "futuristas",
    css: '"Orbitron", monospace',
  },
  {
    id: "russo",
    nombre: "Russo One",
    categoria: "futuristas",
    css: '"Russo One", Arial, sans-serif',
  },
  {
    id: "spacegrotesk",
    nombre: "Space Grotesk",
    categoria: "futuristas",
    css: '"Space Grotesk", Arial, sans-serif',
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
  { id: "manuscritas", label: "Manuscritas" },
  { id: "retro", label: "Retro" },
  { id: "futuristas", label: "Futuristas" },
];

export function buscarFuente(css) {
  return FUENTES_TEXTO.find((f) => f.css === css) ?? null;
}

// El canvas solo puede dibujar una fuente web si ya terminó de descargar;
// esto fuerza su carga con el peso/estilo exacto con el que se dibuja.
export async function cargarFuenteParaCanvas(familia, { peso = "400", estilo = "" } = {}) {
  if (typeof document === "undefined" || !document.fonts) return;
  // Carga tanto el peso normal como el bold para que el toggle sea visible
  const variantes = new Set([`${estilo}${peso} 32px ${familia}`, `400 32px ${familia}`, `700 32px ${familia}`, `800 32px ${familia}`]);
  for (const v of variantes) {
    try {
      await document.fonts.load(v, "Aa");
    } catch {
      // fallback
    }
  }
  // Compatibilidad: si se llamó como cargarFuenteParaCanvas("Arial") (string solo), también funciona
  if (typeof familia === "string" && !familia.includes("px")) {
    // ya cargado arriba
  }
}
