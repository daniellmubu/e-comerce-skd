import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import camisetaBase from "../../assets/images/products/base/camiseta-base.png";
import camisetaEspalda from "../../assets/images/products/base/camiseta-espalda.png";
import camisetaMangaIzquierda from "../../assets/images/products/base/camiseta-manga-izquierda.png";
import camisetaMangaDerecha from "../../assets/images/products/base/camiseta-manga-derecha.png";
import pocilloFrente from "../../assets/images/products/base/pocillo-frente.png";
import pocilloAsa from "../../assets/images/products/base/pocillo-asa.png";
import procesarDiseno from "../../utils/quitarFondoBlanco";
import { FUENTE_TEXTO_DEFECTO } from "../../utils/fuentesTexto";

// Mockups base (foto blanca/gris con fondo transparente). Las claves coinciden
// con el `tipo` de producto para poder agregar más prendas después (hoodie,
// gorra, bolso, cojín, etc.) sin tocar la lógica.
const IMAGENES = {
  camiseta: camisetaBase,
  mug: pocilloFrente,
};

// Vista base por ubicación de estampado. Cada una comparte dimensiones/
// perspectiva con la vista frontal de su producto para que la máscara y las
// coordenadas (%) del editor coincidan entre vistas.
const BASES_POR_CARA = {
  camiseta: {
    frente: camisetaBase,
    espalda: camisetaEspalda,
    mangaIzquierda: camisetaMangaIzquierda,
    mangaDerecha: camisetaMangaDerecha,
  },
  mug: {
    frente: pocilloFrente,
    atras: pocilloAsa,
  },
};

// Ancho base de cada imagen insertada (fracción del contenedor) antes de
// aplicar la escala del usuario. Se comparte con el Personalizador para que el
// aplanado final (imagen que se guarda) coincida con lo que se ve en pantalla.
export const ANCHO_IMAGEN_BASE = 0.38;

// Límites de escalado por eje para las imágenes insertadas. El máximo llega
// justo antes de que el diseño exceda el área imprimible del lienzo (con el
// ancho base del 38%, x2.5 ≈ 95% del lienzo); por encima de eso el marco
// recorta la imagen y agrandar deja de verse.
export const ESCALA_MIN = 0.2;
export const ESCALA_MAX = 2.5;

function clamp(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

// Dibuja una sola imagen del diseño quitándole el fondo blanco (para que no
// mezcle sus colores con el color de la prenda). Procesa cada imagen por su
// cuenta, de modo que se puedan apilar varias.
function ImagenDiseno({ url, alt }) {
  const [procesada, setProcesada] = useState(null);

  useEffect(() => {
    if (!url) {
      setProcesada(null);
      return undefined;
    }

    let activo = true;

    procesarDiseno(url)
      .then(({ dataUrl }) => {
        if (activo) setProcesada(dataUrl);
      })
      .catch(() => {
        // Si no se pudo procesar (CORS, etc.), usamos la original tal cual.
        if (activo) setProcesada(url);
      });

    return () => {
      activo = false;
    };
  }, [url]);

  if (!procesada) return null;

  return (
    <img
      src={procesada}
      alt={alt}
      draggable={false}
      className="block w-full"
      style={{ pointerEvents: "none" }}
    />
  );
}

// Marco de ajuste propio: líneas que rodean la imagen + puntos en esquinas y
// centros de cada lado. Arrastrar cualquier línea o punto cambia el tamaño
// (ancho/alto independientes) compensando la rotación de la imagen.
function MarcoAjuste({
  objetivo,
  hostRef,
  posX,
  posY,
  escalaX,
  escalaY,
  rotacion,
  onCambio,
}) {
  const [caja, setCaja] = useState(null);

  const medir = () => {
    const host = hostRef?.current;
    if (!objetivo || !host) return;
    const r = objetivo.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    if (!r.width || !h.width) return;
    setCaja({
      left: r.left - h.left,
      top: r.top - h.top,
      width: r.width,
      height: r.height,
    });
  };

  // posX/posY van en las dependencias para que el marco se re-mida en cada
  // arrastre: al mover la imagen no cambia ni su tamaño ni su rotación, así
  // que sin esto el recuadro quedaría "pegado" en la posición anterior.
  useLayoutEffect(medir, [
    objetivo,
    hostRef,
    posX,
    posY,
    escalaX,
    escalaY,
    rotacion,
  ]);

  useEffect(() => {
    const host = hostRef?.current;
    if (!objetivo || !host) return undefined;
    // Remide cuando el lienzo cambia de tamaño o se desplaza (zoom/scroll).
    const obs = new ResizeObserver(medir);
    obs.observe(host);
    obs.observe(objetivo);
    window.addEventListener("scroll", medir, true);
    window.addEventListener("resize", medir);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", medir, true);
      window.removeEventListener("resize", medir);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objetivo, hostRef]);

  if (!caja) return null;

  const iniciarAjuste = (e, direccion) => {
    e.stopPropagation();
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);

    const inicio = {
      px: e.clientX,
      py: e.clientY,
      w: caja.width,
      h: caja.height,
      sx: escalaX ?? 1,
      sy: escalaY ?? 1,
      rot: ((rotacion ?? 0) * Math.PI) / 180,
    };

    const mover = (ev) => {
      const dx = ev.clientX - inicio.px;
      const dy = ev.clientY - inicio.py;
      const cos = Math.cos(inicio.rot);
      const sin = Math.sin(inicio.rot);
      // Delta de pantalla proyectado a los ejes locales del marco rotado.
      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;

      let w = inicio.w;
      let h = inicio.h;
      if (direccion.includes("e")) w += lx;
      if (direccion.includes("w")) w -= lx;
      if (direccion.includes("s")) h += ly;
      if (direccion.includes("n")) h -= ly;

      const nx = Math.min(
        ESCALA_MAX,
        Math.max(ESCALA_MIN, (w / inicio.w) * inicio.sx)
      );
      const ny = Math.min(
        ESCALA_MAX,
        Math.max(ESCALA_MIN, (h / inicio.h) * inicio.sy)
      );
      onCambio(nx, ny);
    };

    const soltar = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    // Si el gesto se interrumpe (alt-tab, llamada entrante en táctil), los
    // listeners quedarían colgados hasta el próximo pointerup.
    window.addEventListener("pointercancel", soltar);
  };

  const esquinas = [
    { dir: "nw", estilo: { left: -6, top: -6, cursor: "nwse-resize" } },
    { dir: "ne", estilo: { right: -6, top: -6, cursor: "nesw-resize" } },
    { dir: "sw", estilo: { left: -6, bottom: -6, cursor: "nesw-resize" } },
    { dir: "se", estilo: { right: -6, bottom: -6, cursor: "nwse-resize" } },
  ];
  const bordes = [
    { dir: "n", estilo: { left: 8, right: 8, top: -5, height: 10, cursor: "ns-resize" } },
    { dir: "s", estilo: { left: 8, right: 8, bottom: -5, height: 10, cursor: "ns-resize" } },
    { dir: "w", estilo: { top: 8, bottom: 8, left: -5, width: 10, cursor: "ew-resize" } },
    { dir: "e", estilo: { top: 8, bottom: 8, right: -5, width: 10, cursor: "ew-resize" } },
  ];

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: caja.left,
        top: caja.top,
        width: caja.width,
        height: caja.height,
      }}
    >
      {/* Líneas del marco */}
      <div className="absolute inset-0 border-2 border-dashed border-indigo-500 dark:border-cyan-400" />

      {/* Bordes arrastrables (líneas de ajuste) */}
      {bordes.map((b) => (
        <div
          key={b.dir}
          onPointerDown={(ev) => iniciarAjuste(ev, b.dir)}
          className="pointer-events-auto absolute rounded bg-indigo-500/40 dark:bg-cyan-400/40"
          style={b.estilo}
        />
      ))}

      {/* Puntos de las esquinas */}
      {esquinas.map((c) => (
        <div
          key={c.dir}
          onPointerDown={(ev) => iniciarAjuste(ev, c.dir)}
          className="pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-indigo-500 bg-white shadow dark:border-cyan-400 dark:bg-slate-900"
          style={c.estilo}
        />
      ))}
    </div>
  );
}

function PrendaMockup({
  tipo = "camiseta",
  cara = null,
  color = null,
  imagenes = [],
  imagenActivaId = null,
  onImagenChange,
  onSeleccionarImagen,
  texto = "",
  colorTexto = "#111111",
  fuenteTexto = FUENTE_TEXTO_DEFECTO,
  tamanoTexto = 32,
  posicionTexto = { x: 50, y: 50 },
  onPosicionTextoChange,
  rotacionTexto = 0,
  escalaTexto = 1,
  onTextoTransformChange,
  textoActivo = false,
  onSeleccionarTexto,
  interactivo = true,
}) {
  // Vista base según la ubicación activa; con fallback a la frontal del
  // producto (o de la camiseta) si la ubicación no tiene asset propio.
  const base =
    (cara && BASES_POR_CARA[tipo]?.[cara]) ||
    IMAGENES[tipo] ||
    camisetaBase;
  const contenedorRef = useRef(null);
  const startRef = useRef(null);
  const [target, setTarget] = useState(null);
  // Dimensiones naturales de la vista base. Si la imagen es más ancha que
  // alta (ej. exports 1920x1080), se muestra recortada al cuadrado central
  // para que la prenda llene el lienzo y las 4 vistas tengan igual escala.
  const [dimBase, setDimBase] = useState({ w: 1, h: 1 });
  const ratioBase = dimBase.w / dimBase.h;

  // Ancho real del lienzo en px. El texto de referencia se definió sobre un
  // mockup de 500px; escalarlo por (ancho/500) hace que el editor 2D coincida
  // con la vista 3D y con la imagen guardada sin importar el zoom/pantalla.
  const [anchoLienzo, setAnchoLienzo] = useState(0);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return undefined;
    const medirAncho = () =>
      setAnchoLienzo(el.getBoundingClientRect().width);
    medirAncho();
    const obs = new ResizeObserver(medirAncho);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Las vistas de manga permiten estampar también el costado/lateral del
  // torso: sus diseños NO se recortan con la silueta de la manga.
  const permitirDesborde =
    tipo === "camiseta" && (cara === "mangaIzquierda" || cara === "mangaDerecha");

  // Elemento actualmente editable (imagen activa o texto).
  const elementoActivo = imagenActivaId
    ? { tipo: "imagen", id: imagenActivaId }
    : textoActivo
      ? { tipo: "texto" }
      : null;

  const seleccionarImagen = (id) => {
    if (!interactivo) return;
    if (onSeleccionarImagen) onSeleccionarImagen(id);
  };

  const seleccionarTexto = (e) => {
    if (!interactivo) return;
    e.stopPropagation();
    if (onSeleccionarTexto) onSeleccionarTexto();
  };

  const limpiarSeleccion = () => {
    if (!interactivo) return;
    if (onSeleccionarImagen) onSeleccionarImagen(null);
    if (onSeleccionarTexto) onSeleccionarTexto(false);
  };

  // --- Callbacks de react-moveable (arrastrar / redimensionar / rotar) ---

  const onDragStart = () => {
    const act = elementoActivo;
    if (!act) return;
    if (act.tipo === "imagen") {
      const img = imagenes.find((i) => i.id === act.id);
      if (img) startRef.current = { tipo: "imagen", id: img.id, x: img.x, y: img.y };
    } else {
      startRef.current = { tipo: "texto", x: posicionTexto.x, y: posicionTexto.y };
    }
  };

  const onDrag = ({ beforeTranslate }) => {
    const s = startRef.current;
    const contenedor = contenedorRef.current;
    if (!s || !contenedor) return;

    const rect = contenedor.getBoundingClientRect();
    const nx = clamp(s.x + (beforeTranslate[0] / rect.width) * 100, 0, 100);
    const ny = clamp(s.y + (beforeTranslate[1] / rect.height) * 100, 0, 100);

    if (s.tipo === "imagen") onImagenChange?.(s.id, { x: nx, y: ny });
    else onPosicionTextoChange?.({ x: nx, y: ny });
  };

  const onResizeStart = () => {
    const act = elementoActivo;
    if (!act) return;
    if (act.tipo === "imagen") {
      const img = imagenes.find((i) => i.id === act.id);
      if (img) {
        // Escalas separadas por eje (compatibles con la escala uniforme
        // antigua): permiten ajustar el marco libremente con los puntos.
        startRef.current = {
          tipo: "imagen",
          id: img.id,
          escalaX: img.escalaX ?? img.escala ?? 1,
          escalaY: img.escalaY ?? img.escala ?? 1,
        };
      }
    } else {
      startRef.current = { tipo: "texto", escala: escalaTexto ?? 1 };
    }
  };

  const onResize = ({ scale }) => {
    const s = startRef.current;
    if (!s) return;
    if (s.tipo === "imagen") {
      const nuevaX = clamp((s.escalaX ?? 1) * scale[0], ESCALA_MIN, ESCALA_MAX);
      const nuevaY = clamp((s.escalaY ?? 1) * scale[1], ESCALA_MIN, ESCALA_MAX);
      onImagenChange?.(s.id, { escalaX: nuevaX, escalaY: nuevaY });
    } else {
      const nuevaEscala = clamp((s.escala ?? 1) * scale[0], 0.2, 4);
      onTextoTransformChange?.({ escala: nuevaEscala });
    }
  };

  const onRotateStart = () => {
    const act = elementoActivo;
    if (!act) return;
    if (act.tipo === "imagen") {
      const img = imagenes.find((i) => i.id === act.id);
      if (img) startRef.current = { tipo: "imagen", id: img.id, rotacion: img.rotacion ?? 0 };
    } else {
      startRef.current = { tipo: "texto", rotacion: rotacionTexto ?? 0 };
    }
  };

  const onRotate = ({ beforeRotate }) => {
    const s = startRef.current;
    if (!s) return;
    const nuevaRotacion = (s.rotacion ?? 0) + (beforeRotate ?? 0);
    if (s.tipo === "imagen") onImagenChange?.(s.id, { rotacion: nuevaRotacion });
    else onTextoTransformChange?.({ rotacion: nuevaRotacion });
  };

  // Máscara con la silueta del producto: recorta la capa de color, las imágenes
  // y el texto para que nada se salga de la prenda (así se ve "estampado").
  // Cuando la vista base es más ancha que el lienzo, la máscara se dimensiona
  // igual que la imagen visible (cuadrado central del fotograma).
  const mascara = {
    WebkitMaskImage: `url(${base})`,
    WebkitMaskSize: `${ratioBase * 100}% 100%`,
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "50% 50%",
    maskImage: `url(${base})`,
    maskSize: `${ratioBase * 100}% 100%`,
    maskRepeat: "no-repeat",
    maskPosition: "50% 50%",
  };

  return (
    <div
      ref={contenedorRef}
      className="relative aspect-square w-full overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {/* 1. Foto base del producto, recortada al cuadrado central y centrada.
             key={base} fuerza remount al cambiar de vista para evitar
             imágenes obsoletas del navegador/dev server. */}
      <img
        key={base}
        src={base}
        alt={`Mockup ${tipo}`}
        draggable={false}
        onLoad={(e) =>
          setDimBase({
            w: e.currentTarget.naturalWidth || 1,
            h: e.currentTarget.naturalHeight || 1,
          })
        }
        className="absolute top-0 h-full max-w-none"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          width: `${ratioBase * 100}%`,
        }}
      />

      {/* 2. Color del producto, mezclado con "multiply" y recortado a la silueta */}
      {color && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: color, mixBlendMode: "multiply", ...mascara }}
        />
      )}

      {/* 3. Imágenes insertadas (subidas o generadas por IA). En frente y
              espalda se recortan a la silueta; en las vistas de manga se
              permite desbordar hacia el costado del torso. Con react-moveable
              se pueden arrastrar, redimensionar y rotar libremente. */}
      <div
        className="absolute inset-0"
        style={permitirDesborde ? undefined : mascara}
        onPointerDown={limpiarSeleccion}
      >
        {imagenes.map((imagen) => {
          const esActiva = imagen.id === imagenActivaId;
          return (
            <div
              key={imagen.id}
              ref={esActiva ? setTarget : undefined}
              onPointerDown={(e) => {
                e.stopPropagation();
                seleccionarImagen(imagen.id);
              }}
              style={{
                position: "absolute",
                left: `${imagen.x}%`,
                top: `${imagen.y}%`,
                width: `${ANCHO_IMAGEN_BASE * 100}%`,
                transform: `translate(-50%, -50%) rotate(${imagen.rotacion ?? 0}deg) scale(${imagen.escalaX ?? imagen.escala ?? 1}, ${imagen.escalaY ?? imagen.escala ?? 1})`,
                transformOrigin: "center center",
                cursor: "move",
                touchAction: "none",
              }}
            >
              <div
                className={
                  esActiva
                    ? "rounded-sm"
                    : "rounded-sm outline outline-1 outline-transparent transition hover:outline-cyan-300 dark:hover:outline-cyan-600"
                }
              >
                <ImagenDiseno url={imagen.url} alt="Imagen insertada" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Texto opcional: también se puede arrastrar, redimensionar y rotar
              (solo se recorta a la silueta salvo en vistas de manga). */}
      {texto.trim() && (
        <div
          className="pointer-events-none absolute inset-0"
          style={permitirDesborde ? undefined : mascara}
        >
          <p
            ref={textoActivo ? setTarget : undefined}
            onPointerDown={seleccionarTexto}
            className="pointer-events-auto"
            style={{
              position: "absolute",
              left: `${posicionTexto.x}%`,
              top: `${posicionTexto.y}%`,
              color: colorTexto,
              fontFamily: fuenteTexto,
              fontSize: `${Math.round(
                tamanoTexto * ((anchoLienzo || 500) / 500)
              )}px`,
              fontWeight: 600,
              lineHeight: 1.1,
              textAlign: "center",
              whiteSpace: "nowrap",
              cursor: "move",
              touchAction: "none",
              userSelect: "none",
              transform: `translate(-50%, -50%) rotate(${rotacionTexto ?? 0}deg) scale(${escalaTexto ?? 1})`,
            }}
          >
            {texto}
          </p>
        </div>
      )}

      {/* Marco de ajuste propio sobre la imagen activa: líneas + puntos que
          permiten cambiar el tamaño arrastrando. */}
      {interactivo &&
        elementoActivo?.tipo === "imagen" &&
        target &&
        (() => {
          const activa = imagenes.find((i) => i.id === elementoActivo.id);
          if (!activa) return null;
          return (
            <MarcoAjuste
              objetivo={target}
              hostRef={contenedorRef}
              posX={activa.x}
              posY={activa.y}
              escalaX={activa.escalaX ?? activa.escala ?? 1}
              escalaY={activa.escalaY ?? activa.escala ?? 1}
              rotacion={activa.rotacion ?? 0}
              onCambio={(nx, ny) =>
                onImagenChange?.(elementoActivo.id, {
                  escalaX: nx,
                  escalaY: ny,
                })
              }
            />
          );
        })()}

      {/* Control de editor libre (react-moveable): arrastrar y rotar. El
          redimensionado de imágenes lo resuelve el marco propio de arriba;
          el texto conserva el ajuste con los puntos de Moveable. */}
      {interactivo && target && (
        <Moveable
          target={target}
          container={contenedorRef.current}
          draggable
          resizable={elementoActivo?.tipo !== "imagen"}
          rotatable
          throttleDrag={0}
          throttleResize={0}
          throttleRotate={0}
          origin={false}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onResizeStart={onResizeStart}
          onResize={onResize}
          onRotateStart={onRotateStart}
          onRotate={onRotate}
        />
      )}
    </div>
  );
}

export default PrendaMockup;
