import { useEffect, useRef, useState } from "react";
import {
  MUG_PRINT_WIDTH_PX,
  MUG_PRINT_HEIGHT_PX,
  JARRA_PRINT_WIDTH_PX,
  JARRA_PRINT_HEIGHT_PX,
} from "../../utils/texturaPrenda";

/**
 * Editor 2D por cara (frente / izquierda / derecha) para mugs y jarras.
 * Muestra el área desplegada rectangular (cilindro -> plano) y permite
 * colocar y arrastrar imágenes, textos y emojis en 2D.
 * Las coordenadas x/y son % del rectángulo (0-100), idénticas a las que
 * usa el visor 3D (u*100, v*100) y al print-ready, para paridad WYSIWYG.
 */
const FACTOR_CILINDRICO_BASE = (2 * Math.PI * 1.1) / 2.0; // 3.4558

// Zoom por cara para que el vaso se vea GRANDE al editar (mide bbox real de los PNG).
// Frente 2400x1319 con bbox 579x909 (24%x69%) queda minúsculo sin zoom; laterales ya ocupan 51%.
// Valores calculados para que bbox llene ~38-42% ancho sin recortar mucho alto (overflow hidden).
const ZOOM_MOCKUP = {
  mug: { frente: 1.75, izquierda: 1.30, derecha: 1.30 },
  mug_magico: { frente: 1.75, izquierda: 1.30, derecha: 1.30 },
  jarra_cervecera: { frente: 1.85, izquierda: 1.55, derecha: 1.55 },
};

function getDimensiones(selectedProduct) {
  const esJarra = selectedProduct === "jarra_cervecera";
  return {
    esJarra,
    ancho: esJarra ? JARRA_PRINT_WIDTH_PX : MUG_PRINT_WIDTH_PX,
    alto: esJarra ? JARRA_PRINT_HEIGHT_PX : MUG_PRINT_HEIGHT_PX,
    anchoBase: esJarra ? 0.28 : 0.22,
  };
}

export function Panel2D({
  cara,
  titulo,
  selectedProduct,
  baseImagen, // url de la foto base del vaso para esta cara (mug-frente, izquierda, derecha...)
  imagenes = [],
  emojis = [],
  capasTexto = [],
  imagenActivaId,
  textoActivoId,
  emojiActivoId,
  imagenPendiente,
  onColocar, // (cara, x%, y%) => void
  onMoverImagen, // (id, x%, y%, cara) => void
  onMoverTexto, // (id, x%, y%, cara) => void
  onMoverEmoji, // (id, x%, y%, cara) => void
  onSeleccionarImagen,
  onSeleccionarTexto,
  onSeleccionarEmoji,
  onDeseleccionarTodo,
  activa, // si esta cara es la activa (borde resaltado)
  colorProducto, // hex para tinte de fondo
}) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState(null); // { tipo, id }
  const [imgRatio, setImgRatio] = useState(null); // ancho/alto de la foto base para que el vaso se vea grande

  const { ancho, alto, anchoBase } = getDimensiones(selectedProduct);
  const factorRect = FACTOR_CILINDRICO_BASE / (ancho / alto);
  const INSET = 0.88;

  // Detecta la relación de aspecto real de la foto del vaso para que el lienzo
  // se adapte al producto y el vaso se vea GRANDE (como el visor 3D), no pequeño
  // dentro de un rectángulo apaisado de impresión.
  useEffect(() => {
    if (!baseImagen) {
      setImgRatio(null);
      return;
    }
    let cancelado = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelado && img.naturalWidth && img.naturalHeight) {
        setImgRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => {
      if (!cancelado) setImgRatio(null);
    };
    img.src = baseImagen;
    return () => {
      cancelado = true;
    };
  }, [baseImagen]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    // inicial
    const rect = el.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  const pctDesdeEvento = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(2, Math.min(98, x)),
      y: Math.max(2, Math.min(98, y)),
    };
  };

  const handlePointerDownFondo = (e) => {
    // solo botón principal
    if (e.button !== 0) return;
    const { x, y } = pctDesdeEvento(e);
    if (imagenPendiente && onColocar) {
      onColocar(cara, x, y);
      return;
    }
    // click en fondo deselecciona
    if (onDeseleccionarTodo) onDeseleccionarTodo();
  };

  const iniciarDrag = (e, tipo, id) => {
    e.stopPropagation();
    e.preventDefault();
    // seleccionar
    if (tipo === "imagen" && onSeleccionarImagen) onSeleccionarImagen(id);
    if (tipo === "texto" && onSeleccionarTexto) onSeleccionarTexto(id);
    if (tipo === "emoji" && onSeleccionarEmoji) onSeleccionarEmoji(id);
    setDrag({ tipo, id });
    // capturar pointer
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e) => {
    if (!drag) return;
    const { x, y } = pctDesdeEvento(e);
    if (drag.tipo === "imagen" && onMoverImagen) onMoverImagen(drag.id, x, y, cara);
    if (drag.tipo === "texto" && onMoverTexto) onMoverTexto(drag.id, x, y, cara);
    if (drag.tipo === "emoji" && onMoverEmoji) onMoverEmoji(drag.id, x, y, cara);
  };

  const handlePointerUp = () => {
    setDrag(null);
  };

  // tamaño visual de una imagen en px dentro del contenedor
  const estiloImagen = (img) => {
    if (!size.w || !size.h) return { width: "18%", height: "auto" };
    const escala = img.escala ?? 1;
    const aspect =
      img.naturalWidth && img.naturalHeight
        ? img.naturalHeight / img.naturalWidth
        : 1;
    const baseW = size.w * anchoBase * escala * INSET;
    // clamp similar a texturaPrenda
    const MAX_ANCHO = size.w * 0.9;
    const baseWM = Math.min(baseW, MAX_ANCHO);
    // altura corregida cilíndrica
    let baseH = baseWM * aspect * factorRect;
    const MAX_ALTO = size.h * 0.9;
    if (baseH > MAX_ALTO) {
      const r = MAX_ALTO / baseH;
      baseH *= r;
      // mantener aspecto -> ajustar baseWM también
    }
    // si clamp por alto, recalcular ancho proporcional para no deformar
    // (aprox: si baseH se clampó, el ancho efectivo es baseH / (aspect*factorRect))
    let wFinal = baseWM;
    let hFinal = baseH;
    if (baseH > MAX_ALTO) {
      hFinal = MAX_ALTO;
      wFinal = hFinal / (aspect * factorRect);
    }
    return { width: `${wFinal}px`, height: `${hFinal}px` };
  };

  const estiloTexto = (t) => {
    if (!size.w) return { fontSize: `${t.tamano ?? 32}px` };
    // escala similar a print: tam * (ancho / 512) -> para preview usar size.w / 512
    const tamBase = t.tamano ?? 32;
    const escala = t.escala ?? 1;
    // size.w corresponde a ancho impreso escalado a preview; proporcional
    const px = Math.round((tamBase * size.w) / 512 * escala);
    const clamped = Math.max(8, Math.min(96, px));
    return { fontSize: `${clamped}px` };
  };

  const estiloEmoji = (em) => {
    if (!size.w) return { fontSize: `32px` };
    const base = em.tamano ?? 48;
    const escala = em.escala ?? 1;
    const px = Math.round((base * size.w) / 512 * escala);
    return { fontSize: `${Math.max(12, Math.min(120, px))}px` };
  };

  const cmW = getDimensiones(selectedProduct).ancho === MUG_PRINT_WIDTH_PX ? 20 : 24;
  const cmH = getDimensiones(selectedProduct).alto === MUG_PRINT_HEIGHT_PX ? 9 : 12;
  // Si hay foto base, el vaso se muestra GRANDE ocupando todo el lienzo (como el 3D).
  // El lienzo adopta la proporción real de la foto; si aún no cargó, usa 3/4 vertical.
  const displayAspect = baseImagen ? (imgRatio ? `${imgRatio}` : "3 / 4") : `${ancho} / ${alto}`;
  const zoomMockup = ZOOM_MOCKUP[selectedProduct]?.[cara] ?? 1;

  return (
    <div className={`flex flex-col gap-2 rounded-2xl border-2 bg-white p-3 dark:bg-slate-900 ${activa ? "border-indigo-500 dark:border-cyan-400" : "border-gray-200 dark:border-slate-700"}`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-bold ${activa ? "text-indigo-600 dark:text-cyan-300" : "text-gray-600 dark:text-slate-400"}`}>
          {titulo} {activa && <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white dark:bg-cyan-500">Activa</span>}
        </h3>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">
          {baseImagen ? `Vista ${titulo}` : `${cmW}×${cmH} cm · ${ancho}×${alto}px · 300 DPI`}
        </span>
      </div>

      <div
        ref={ref}
        onPointerDown={handlePointerDownFondo}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative select-none overflow-hidden rounded-xl border bg-white dark:bg-slate-900 shadow-sm"
        style={{
          aspectRatio: displayAspect,
          backgroundColor: colorProducto && !baseImagen ? `${colorProducto}14` : "#ffffff",
          borderColor: activa ? "#6366f1" : undefined,
          borderWidth: activa ? "2px" : "1px",
          borderStyle: activa ? "solid" : "dashed",
          cursor: imagenPendiente ? "crosshair" : drag ? "grabbing" : "pointer",
          touchAction: "none",
        }}
        title={
          imagenPendiente
            ? `Haz clic sobre el vaso (${titulo}) para colocar la imagen`
            : `Haz clic sobre el vaso (${titulo}) para activar. Arrastra los elementos sobre el vaso.`
        }
      >
        {/* Foto base del vaso GRANDE — ocupa todo el lienzo como en el visor 3D */}
        {baseImagen ? (
          <img
            src={baseImagen}
            alt={`${titulo} - ${selectedProduct}`}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain bg-white dark:bg-slate-950"
            style={{ transform: `scale(${zoomMockup})`, transformOrigin: "center center" }}
          />
        ) : (
          // Fallback si no hay foto: cuadrícula del área de impresión
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "20% 20%",
            }}
          />
        )}

        {/* Tinte del color del producto sobre el vaso (muy sutil, no tapa la foto) */}
        {baseImagen && colorProducto && (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.18]"
            style={{ backgroundColor: colorProducto }}
          />
        )}

        {/* imágenes */}
        {imagenes.map((img) => {
          const activo = img.id === imagenActivaId;
          const s = estiloImagen(img);
          return (
            <div
              key={img.id}
              onPointerDown={(e) => iniciarDrag(e, "imagen", img.id)}
              className={`absolute flex items-center justify-center overflow-hidden rounded-[2px] ${activo ? "ring-2 ring-indigo-500 dark:ring-cyan-400" : "ring-1 ring-black/10"}`}
              style={{
                left: `${img.x ?? 50}%`,
                top: `${img.y ?? 50}%`,
                width: s.width,
                height: s.height,
                transform: `translate(-50%, -50%) rotate(${img.rotacion ?? 0}deg)`,
                cursor: "grab",
                zIndex: activo ? 20 : 5,
                background: "transparent",
              }}
              title={`${img.x?.toFixed(0) ?? 50}%, ${img.y?.toFixed(0) ?? 50}% · clic para seleccionar, arrastra para mover`}
            >
              <img
                src={img.url}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-contain"
                style={{ filter: activo ? "drop-shadow(0 1px 4px rgba(99,102,241,0.4))" : undefined }}
              />
              {activo && (
                <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[8px] text-white dark:bg-cyan-500">
                  ✓
                </span>
              )}
            </div>
          );
        })}

        {/* capas de texto */}
        {capasTexto.map((t) => {
          const activo = t.id === textoActivoId;
          return (
            <div
              key={t.id}
              onPointerDown={(e) => iniciarDrag(e, "texto", t.id)}
              className={`absolute max-w-[80%] whitespace-nowrap px-1 text-center leading-none ${activo ? "ring-2 ring-indigo-500 dark:ring-cyan-400" : ""} rounded`}
              style={{
                left: `${t.x ?? 50}%`,
                top: `${t.y ?? 50}%`,
                transform: `translate(-50%, -50%) rotate(${t.rotacion ?? 0}deg) scale(${t.escala ?? 1})`,
                fontFamily: t.fuente,
                color: t.color,
                fontWeight: t.negrita ? 800 : 400,
                fontStyle: t.cursiva ? "italic" : "normal",
                textDecoration: t.subrayado ? "underline" : "none",
                cursor: "grab",
                zIndex: activo ? 21 : 6,
                ...estiloTexto(t),
              }}
              title="Texto · arrastra para mover"
            >
              {t.contenido}
            </div>
          );
        })}

        {/* emojis */}
        {emojis.map((em) => {
          const activo = em.id === emojiActivoId;
          return (
            <div
              key={em.id}
              onPointerDown={(e) => iniciarDrag(e, "emoji", em.id)}
              className={`absolute select-none leading-none ${activo ? "ring-2 ring-indigo-500 dark:ring-cyan-400" : ""} rounded`}
              style={{
                left: `${em.x ?? 50}%`,
                top: `${em.y ?? 50}%`,
                transform: `translate(-50%, -50%) rotate(${em.rotacion ?? 0}deg)`,
                cursor: "grab",
                zIndex: activo ? 22 : 7,
                ...estiloEmoji(em),
              }}
            >
              {em.emoji}
            </div>
          );
        })}

        {/* hint colocar */}
        {imagenPendiente && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow dark:bg-cyan-500">
              Click para colocar
            </span>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] leading-tight text-gray-400 dark:text-slate-500">
        {imagenes.length} imágenes · {capasTexto.length} textos · {emojis.length} emojis
        <br />
        Haz clic en el área para {imagenPendiente ? "colocar" : "activar la cara"} · Arrastra los elementos
      </p>
    </div>
  );
}

export default Panel2D;
