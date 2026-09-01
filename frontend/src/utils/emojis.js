// Catálogo amplio de emojis para el personalizador.
// Cada entrada tiene: emoji, nombre, categoria y keywords para búsqueda.
// Código Unicode se genera automáticamente (U+HEX) para mostrar y para entrada por código.

function codeFromEmoji(emoji) {
  const cps = [...emoji].map((ch) => ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));
  // Para secuencias con ZWJ (familias, banderas) mostramos todos los codepoints unidos con espacio
  return cps.map((c) => `U+${c}`).join(" ");
}

const RAW = [
  // Caras y emociones
  { e: "😀", n: "cara sonriente", c: "Caras", k: "feliz alegre sonrisa :grinning:" },
  { e: "😃", n: "sonrisa abierta", c: "Caras", k: "feliz :smiley:" },
  { e: "😄", n: "sonrisa ojos cerrados", c: "Caras", k: "feliz :smile:" },
  { e: "😁", n: "sonrisa dientes", c: "Caras", k: "feliz :grin:" },
  { e: "😆", n: "risa entrecerrada", c: "Caras", k: "feliz :laughing:" },
  { e: "😅", n: "risa sudor", c: "Caras", k: "alivio :sweat_smile:" },
  { e: "😂", n: "llorar de risa", c: "Caras", k: "risa llorar :joy:" },
  { e: "🤣", n: "rodando de risa", c: "Caras", k: "risa carcajada :rofl:" },
  { e: "🥲", n: "sonrisa lagrima", c: "Caras", k: "emocionado :smiling_tear:" },
  { e: "😊", n: "sonrojado", c: "Caras", k: "feliz rubor :blush:" },
  { e: "😇", n: "angel", c: "Caras", k: "inocente halo :innocent:" },
  { e: "🙂", n: "leve sonrisa", c: "Caras", k: "suave :slightly_smiling:" },
  { e: "🙃", n: "al reves", c: "Caras", k: "broma :upside_down:" },
  { e: "😉", n: "guiño", c: "Caras", k: "coqueto :wink:" },
  { e: "😌", n: "alivio", c: "Caras", k: "tranquilo :relieved:" },
  { e: "😍", n: "ojos corazon", c: "Caras", k: "amor enamorado :heart_eyes:" },
  { e: "🥰", n: "3 corazones", c: "Caras", k: "amor :smiling_hearts:" },
  { e: "😘", n: "beso corazon", c: "Caras", k: "amor beso :kissing_heart:" },
  { e: "🤩", n: "estrellas", c: "Caras", k: "estrellas wow :star_struck:" },
  { e: "🤗", n: "abrazo", c: "Caras", k: "abrazo :hugging:" },
  { e: "🤔", n: "pensando", c: "Caras", k: "pensar duda :thinking:" },
  { e: "🤨", n: "ceja levantada", c: "Caras", k: "duda :raised_eyebrow:" },
  { e: "😐", n: "neutral", c: "Caras", k: "serio :neutral:" },
  { e: "😑", n: "inexpresivo", c: "Caras", k: "serio :expressionless:" },
  { e: "😶", n: "sin boca", c: "Caras", k: "callado :no_mouth:" },
  { e: "🙄", n: "ojos arriba", c: "Caras", k: "aburrido :roll_eyes:" },
  { e: "😏", n: "sonrisa ladina", c: "Caras", k: "picaro :smirk:" },
  { e: "😣", n: "perseverando", c: "Caras", k: "esfuerzo :persevere:" },
  { e: "😥", n: "triste alivio", c: "Caras", k: "triste :disappointed_relieved:" },
  { e: "😮", n: "boquiabierto", c: "Caras", k: "sorpresa :open_mouth:" },
  { e: "🤐", n: "boca cierre", c: "Caras", k: "callado :zipper_mouth:" },
  { e: "😯", n: "sorprendido", c: "Caras", k: "wow :hushed:" },
  { e: "😪", n: "somnoliento", c: "Caras", k: "sueño :sleepy:" },
  { e: "😴", n: "durmiendo", c: "Caras", k: "sueño zzz :sleeping:" },
  { e: "🥱", n: "bostezo", c: "Caras", k: "cansado :yawning:" },
  { e: "😎", n: "gafas sol", c: "Caras", k: "cool :sunglasses:" },
  { e: "🤓", n: "nerd", c: "Caras", k: "gafas :nerd:" },
  { e: "🥸", n: "disfraz", c: "Caras", k: "nariz :disguised:" },
  { e: "😈", n: "diablito", c: "Caras", k: "malo :imp:" },
  { e: "👻", n: "fantasma", c: "Caras", k: "fantasma :ghost:" },
  { e: "🤖", n: "robot", c: "Caras", k: "robot :robot:" },
  { e: "💀", n: "calavera", c: "Caras", k: "muerte :skull:" },
  // Gestos y manos
  { e: "👍", n: "pulgar arriba", c: "Gestos", k: "like bien :thumbsup:" },
  { e: "👎", n: "pulgar abajo", c: "Gestos", k: "mal :thumbsdown:" },
  { e: "👌", n: "ok", c: "Gestos", k: "ok perfecto :ok_hand:" },
  { e: "✌️", n: "victoria", c: "Gestos", k: "paz :v:" },
  { e: "🤞", n: "dedos cruzados", c: "Gestos", k: "suerte :crossed_fingers:" },
  { e: "🤟", n: "te amo", c: "Gestos", k: "amor :love_you:" },
  { e: "🤘", n: "cuernos", c: "Gestos", k: "rock :metal:" },
  { e: "🤙", n: "llamame", c: "Gestos", k: "telefono :call_me:" },
  { e: "👏", n: "aplausos", c: "Gestos", k: "aplauso bravo :clap:" },
  { e: "🙌", n: "manos arriba", c: "Gestos", k: "celebrar :raised_hands:" },
  { e: "👐", n: "manos abiertas", c: "Gestos", k: "abierto :open_hands:" },
  { e: "🤲", n: "palmas juntas", c: "Gestos", k: "pedir :palms_up:" },
  { e: "🤝", n: "apreton manos", c: "Gestos", k: "acuerdo :handshake:" },
  { e: "🙏", n: "rezando", c: "Gestos", k: "gracias por favor :pray:" },
  { e: "💪", n: "musculo", c: "Gestos", k: "fuerte gym :muscle:" },
  { e: "🦾", n: "brazo robot", c: "Gestos", k: "protesis :mechanical_arm:" },
  { e: "👋", n: "saludo", c: "Gestos", k: "hola adios :wave:" },
  { e: "🤏", n: "pellizco", c: "Gestos", k: "pequeño :pinching:" },
  { e: "✊", n: "puño", c: "Gestos", k: "fuerza :fist:" },
  { e: "👊", n: "puño frontal", c: "Gestos", k: "golpe :punch:" },
  { e: "❤️", n: "corazon rojo", c: "Símbolos", k: "amor corazon :heart:" },
  { e: "🧡", n: "corazon naranja", c: "Símbolos", k: "amor :orange_heart:" },
  { e: "💛", n: "corazon amarillo", c: "Símbolos", k: "amor :yellow_heart:" },
  { e: "💚", n: "corazon verde", c: "Símbolos", k: "amor :green_heart:" },
  { e: "💙", n: "corazon azul", c: "Símbolos", k: "amor :blue_heart:" },
  { e: "💜", n: "corazon morado", c: "Símbolos", k: "amor :purple_heart:" },
  { e: "🖤", n: "corazon negro", c: "Símbolos", k: "amor :black_heart:" },
  { e: "🤍", n: "corazon blanco", c: "Símbolos", k: "amor :white_heart:" },
  { e: "🤎", n: "corazon marron", c: "Símbolos", k: "amor :brown_heart:" },
  { e: "💔", n: "corazon roto", c: "Símbolos", k: "triste :broken_heart:" },
  { e: "❤️‍🔥", n: "corazon fuego", c: "Símbolos", k: "amor ardiente :heart_on_fire:" },
  { e: "💖", n: "corazon brillo", c: "Símbolos", k: "amor :sparkling_heart:" },
  // Animales
  { e: "🐶", n: "perro", c: "Animales", k: "perro mascota :dog:" },
  { e: "🐱", n: "gato", c: "Animales", k: "gato mascota :cat:" },
  { e: "🐭", n: "raton", c: "Animales", k: "raton :mouse:" },
  { e: "🐹", n: "hamster", c: "Animales", k: "hamster :hamster:" },
  { e: "🐰", n: "conejo", c: "Animales", k: "conejo :rabbit:" },
  { e: "🦊", n: "zorro", c: "Animales", k: "zorro :fox:" },
  { e: "🐻", n: "oso", c: "Animales", k: "oso :bear:" },
  { e: "🐼", n: "panda", c: "Animales", k: "panda :panda:" },
  { e: "🐨", n: "koala", c: "Animales", k: "koala :koala:" },
  { e: "🐯", n: "tigre", c: "Animales", k: "tigre :tiger:" },
  { e: "🦁", n: "leon", c: "Animales", k: "leon :lion:" },
  { e: "🐮", n: "vaca", c: "Animales", k: "vaca :cow:" },
  { e: "🐷", n: "cerdo", c: "Animales", k: "cerdo :pig:" },
  { e: "🐸", n: "rana", c: "Animales", k: "rana :frog:" },
  { e: "🐵", n: "mono", c: "Animales", k: "mono :monkey:" },
  { e: "🐔", n: "gallina", c: "Animales", k: "gallina :chicken:" },
  { e: "🐧", n: "pinguino", c: "Animales", k: "pinguino :penguin:" },
  { e: "🐦", n: "pajaro", c: "Animales", k: "pajaro :bird:" },
  { e: "🦄", n: "unicornio", c: "Animales", k: "magia :unicorn:" },
  { e: "🐝", n: "abeja", c: "Animales", k: "abeja miel :bee:" },
  { e: "🦋", n: "mariposa", c: "Animales", k: "mariposa :butterfly:" },
  { e: "🐢", n: "tortuga", c: "Animales", k: "tortuga :turtle:" },
  { e: "🐬", n: "delfin", c: "Animales", k: "delfin :dolphin:" },
  { e: "🦈", n: "tiburon", c: "Animales", k: "tiburon :shark:" },
  { e: "🦢", n: "cisne", c: "Animales", k: "cisne :swan:" },
  // Comida y bebida
  { e: "🍎", n: "manzana roja", c: "Comida", k: "manzana fruta :apple:" },
  { e: "🍊", n: "mandarina", c: "Comida", k: "naranja :tangerine:" },
  { e: "🍋", n: "limon", c: "Comida", k: "limon :lemon:" },
  { e: "🍌", n: "platano", c: "Comida", k: "banana :banana:" },
  { e: "🍉", n: "sandia", c: "Comida", k: "sandia :watermelon:" },
  { e: "🍓", n: "fresa", c: "Comida", k: "fresa :strawberry:" },
  { e: "🍒", n: "cerezas", c: "Comida", k: "cereza :cherries:" },
  { e: "🍑", n: "durazno", c: "Comida", k: "melocoton :peach:" },
  { e: "🍍", n: "piña", c: "Comida", k: "piña :pineapple:" },
  { e: "🥭", n: "mango", c: "Comida", k: "mango :mango:" },
  { e: "🍕", n: "pizza", c: "Comida", k: "pizza :pizza:" },
  { e: "🍔", n: "hamburguesa", c: "Comida", k: "burger :hamburger:" },
  { e: "🍟", n: "papas fritas", c: "Comida", k: "papas :fries:" },
  { e: "🌮", n: "taco", c: "Comida", k: "taco mexicano :taco:" },
  { e: "🍣", n: "sushi", c: "Comida", k: "sushi :sushi:" },
  { e: "☕", n: "cafe", c: "Comida", k: "cafe taza :coffee:" },
  { e: "🍺", n: "cerveza", c: "Comida", k: "cerveza jarra :beer:" },
  { e: "🍷", n: "vino", c: "Comida", k: "vino copa :wine:" },
  { e: "🧁", n: "cupcake", c: "Comida", k: "pastelito :cupcake:" },
  { e: "🎂", n: "torta", c: "Comida", k: "cumpleaños pastel :birthday:" },
  // Deportes y actividades
  { e: "⚽", n: "futbol", c: "Deportes", k: "futbol balon :soccer:" },
  { e: "🏀", n: "baloncesto", c: "Deportes", k: "basket :basketball:" },
  { e: "🏈", n: "americano", c: "Deportes", k: "futbol americano :football:" },
  { e: "⚾", n: "beisbol", c: "Deportes", k: "beisbol :baseball:" },
  { e: "🎾", n: "tenis", c: "Deportes", k: "tenis :tennis:" },
  { e: "🏐", n: "voleibol", c: "Deportes", k: "voley :volleyball:" },
  { e: "🏆", n: "trofeo", c: "Deportes", k: "copa ganador :trophy:" },
  { e: "🥇", n: "medalla oro", c: "Deportes", k: "oro primer :gold:" },
  { e: "🎮", n: "control", c: "Deportes", k: "gaming :video_game:" },
  { e: "🎯", n: "diana", c: "Deportes", k: "dardo :dart:" },
  { e: "🎲", n: "dado", c: "Deportes", k: "juego :dice:" },
  { e: "🎸", n: "guitarra", c: "Deportes", k: "musica rock :guitar:" },
  { e: "🎤", n: "microfono", c: "Deportes", k: "cantar karaoke :microphone:" },
  { e: "🎧", n: "audifonos", c: "Deportes", k: "musica :headphones:" },
  // Naturaleza y clima
  { e: "⭐", n: "estrella", c: "Naturaleza", k: "estrella :star:" },
  { e: "🌟", n: "estrella brillo", c: "Naturaleza", k: "brillo :glowing_star:" },
  { e: "✨", n: "destellos", c: "Naturaleza", k: "brillo magico :sparkles:" },
  { e: "🔥", n: "fuego", c: "Naturaleza", k: "fuego llama :fire:" },
  { e: "💧", n: "gota", c: "Naturaleza", k: "agua gota :droplet:" },
  { e: "🌈", n: "arcoiris", c: "Naturaleza", k: "arcoiris colores :rainbow:" },
  { e: "☀️", n: "sol", c: "Naturaleza", k: "sol dia :sun:" },
  { e: "🌙", n: "luna", c: "Naturaleza", k: "luna noche :moon:" },
  { e: "⛈️", n: "tormenta", c: "Naturaleza", k: "lluvia trueno :storm:" },
  { e: "❄️", n: "copo nieve", c: "Naturaleza", k: "nieve frio :snowflake:" },
  { e: "🌸", n: "flor cerezo", c: "Naturaleza", k: "flor sakura :cherry_blossom:" },
  { e: "🌹", n: "rosa", c: "Naturaleza", k: "rosa flor amor :rose:" },
  { e: "🌻", n: "girasol", c: "Naturaleza", k: "girasol flor :sunflower:" },
  { e: "🍀", n: "trebol", c: "Naturaleza", k: "suerte :shamrock:" },
  { e: "🌴", n: "palmera", c: "Naturaleza", k: "palma playa :palm_tree:" },
  // Objetos y símbolos
  { e: "👑", n: "corona", c: "Símbolos", k: "rey reina corona :crown:" },
  { e: "🎉", n: "fiesta", c: "Símbolos", k: "celebrar confeti :tada:" },
  { e: "🎊", n: "confeti", c: "Símbolos", k: "fiesta :confetti:" },
  { e: "🎁", n: "regalo", c: "Símbolos", k: "regalo :gift:" },
  { e: "💎", n: "diamante", c: "Símbolos", k: "joya diamante :gem:" },
  { e: "💡", n: "bombilla", c: "Símbolos", k: "idea luz :bulb:" },
  { e: "🔔", n: "campana", c: "Símbolos", k: "campana notificacion :bell:" },
  { e: "📌", n: "pin", c: "Símbolos", k: "pin :pushpin:" },
  { e: "📚", n: "libros", c: "Símbolos", k: "libros estudiar :books:" },
  { e: "✏️", n: "lapiz", c: "Símbolos", k: "lapiz escribir :pencil:" },
  { e: "🚀", n: "cohete", c: "Símbolos", k: "cohete espacio :rocket:" },
  { e: "✈️", n: "avion", c: "Símbolos", k: "viaje avion :airplane:" },
  { e: "🚗", n: "carro", c: "Símbolos", k: "auto coche :car:" },
  { e: "⚡", n: "rayo", c: "Símbolos", k: "rayo energia :zap:" },
  { e: "💥", n: "explosion", c: "Símbolos", k: "boom :boom:" },
  { e: "✅", n: "check", c: "Símbolos", k: "check ok :check:" },
  { e: "❌", n: "cruz", c: "Símbolos", k: "error no :x:" },
  { e: "💯", n: "cien", c: "Símbolos", k: "cien perfecto :100:" },
  { e: "🔒", n: "candado", c: "Símbolos", k: "seguro :lock:" },
  { e: "🎨", n: "paleta arte", c: "Símbolos", k: "arte pintar :art:" },
];

export const EMOJIS = RAW.map((r) => ({
  emoji: r.e,
  nombre: r.n,
  categoria: r.c,
  keywords: r.k,
  codigo: codeFromEmoji(r.e),
}));

export const CATEGORIAS = [...new Set(EMOJIS.map((x) => x.categoria))];

export function buscarEmojis(query) {
  if (!query) return EMOJIS;
  const q = query.toLowerCase().trim();
  return EMOJIS.filter(
    (x) =>
      x.emoji.includes(q) ||
      x.nombre.toLowerCase().includes(q) ||
      x.keywords.toLowerCase().includes(q) ||
      x.codigo.toLowerCase().includes(q) ||
      x.categoria.toLowerCase().includes(q)
  );
}

// Convierte un código a emoji real.
// Soporta: "U+1F600", "1F600", "0x1F600", "128512", "&#128512;", "&#x1F600;", ":smile:" aprox, o pegar el emoji directo
const SHORTCODE_MAP = {
  ":grinning:": "😀", ":smiley:": "😃", ":smile:": "😄", ":grin:": "😁", ":joy:": "😂", ":rofl:": "🤣",
  ":heart:": "❤️", ":star:": "⭐", ":fire:": "🔥", ":tada:": "🎉", ":sparkles:": "✨", ":soccer:": "⚽",
  ":crown:": "👑", ":dog:": "🐶", ":thumbsup:": "👍", ":thumbsdown:": "👎", ":clap:": "👏", ":pray:": "🙏",
  ":muscle:": "💪", ":rocket:": "🚀", ":coffee:": "☕", ":beer:": "🍺", ":pizza:": "🍕", ":trophy:": "🏆",
};

export function emojiDesdeCodigo(input) {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // 1) Si ya es un emoji (1-3 chars con codepoints fuera ASCII) devolverlo
  // Heurística: si contiene algún char con codepoint > 255 y longitud pequeña, es emoji ya pegado
  if ([...raw].some((ch) => ch.codePointAt(0) > 0x250) && [...raw].length <= 4) {
    // Validar que al menos un char sea emoji: ya lo asumimos
    // Si el usuario pegó "😀" o "❤️" devolverlo
    if ([...raw].length <= 5 && raw.length <= 8) {
      // No confundir con texto normal: si es 1 emoji real, usamos el primer grapheme
      // Comprobación simple: no es solo ASCII
      if (!/^[\x00-\x7F]+$/.test(raw)) return raw;
    }
  }

  const lower = raw.toLowerCase();

  // 2) Shortcode :nombre:
  if (SHORTCODE_MAP[lower]) return SHORTCODE_MAP[lower];
  // buscar por shortcode parcial en keywords
  for (const e of EMOJIS) {
    if (e.keywords.includes(lower)) {
      // si coincide exacto :xxx: ya resuelto, si no, si el query es parte del keyword devolvemos el primero
      // pero solo si el input es :xxx:
      if (lower.startsWith(":") && lower.endsWith(":")) {
        if (e.keywords.split(" ").some((kw) => kw === lower)) return e.emoji;
      }
    }
  }

  // 3) HTML entity &#12345; o &#x1F600;
  let m = raw.match(/^&#(\d+);$/);
  if (m) {
    const cp = parseInt(m[1], 10);
    if (cp > 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
  }
  m = raw.match(/^&#x([0-9a-fA-F]+);$/);
  if (m) {
    const cp = parseInt(m[1], 16);
    if (cp > 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
  }

  // 4) U+XXXX, 0xXXXX, \uXXXX, XXXX hex, o secuencia "U+1F600 U+1F3FB" / "1F600 1F3FB"
  // Soporta múltiples codepoints separados por espacio, guion o coma (para banderas, familias)
  const hexTokens = [];
  // Normalizar separadores
  const parts = raw.split(/[\s,\-]+/);
  for (let p of parts) {
    p = p.trim();
    if (!p) continue;
    // limpiar prefijos
    let hex = p.replace(/^(U\+|u\+|0x|\\u|\\)/, "");
    hex = hex.replace(/^&#x/, "").replace(/;$/, "");
    // si es decimal puro y grande (ej 128512) tratar como decimal
    if (/^\d+$/.test(hex) && (hex.length >= 4 && parseInt(hex, 10) > 0xfff)) {
      // si es ej 128512 sin prefijo, puede ser decimal
      // intentamos decimal solo si el usuario puso formato &# sin ; o número suelto > 1000
      // pero priorizamos hex si tiene A-F; si es solo dígitos, probamos ambos: si > 0x10FFFF invalid hex, usar decimal
      const dec = parseInt(hex, 10);
      if (dec <= 0x10ffff) {
        // si el hex interpretado como hex sería > 10FFFF pero dec no, usamos dec
        const asHex = parseInt(hex, 16);
        if (asHex > 0x10ffff) {
          hexTokens.push(dec);
          continue;
        }
        // Si el usuario escribió número decimal tipo 128512, hexTokens con hex da valor distinto, preferimos dec cuando longitud 5-6 y no tiene letras
        // heurística: si número >= 10000 y hex interpretado != dec, usar dec
        if (hex.length >= 5 && asHex !== dec) {
          hexTokens.push(dec);
          continue;
        }
      }
    }
    if (/^[0-9a-fA-F]{4,6}$/.test(hex)) {
      const cp = parseInt(hex, 16);
      if (cp > 0 && cp <= 0x10ffff) hexTokens.push(cp);
    } else if (/^\d+$/.test(hex)) {
      const cp = parseInt(hex, 10);
      if (cp > 0 && cp <= 0x10ffff) hexTokens.push(cp);
    }
  }
  if (hexTokens.length) {
    try {
      return String.fromCodePoint(...hexTokens);
    } catch {
      return null;
    }
  }
  return null;
}
