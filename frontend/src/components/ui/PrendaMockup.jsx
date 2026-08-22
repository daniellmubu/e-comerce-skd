import { useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import camisetaBase from "../../assets/images/products/base/camiseta-base.png";
import mugBase from "../../assets/images/products/base/mug-base.png";
import procesarDiseno from "../../utils/quitarFondoBlanco";

// Mockups base (foto blanca/gris con fondo transparente). Las claves coinciden
// con el `tipo` de producto para poder agregar más prendas después (hoodie,
// gorra, bolso, cojín, etc.) sin tocar la lógica.
const IMAGENES = {
  camiseta: camisetaBase,
  mug: mugBase,
};

// Ancho base de cada imagen insertada (fracción del contenedor) antes de
// aplicar la escala del usuario. Se comparte con el Personalizador para que el
// aplanado final (imagen que se guarda) coincida con lo que se ve en pantalla.
export const ANCHO_IMAGEN_BASE = 0.38;

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

function PrendaMockup({
  tipo = "camiseta",
  color = null,
  imagenes = [],
  imagenActivaId = null,
  onImagenChange,
  onSeleccionarImagen,
  texto = "",
  colorTexto = "#111111",
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
  const base = IMAGENES[tipo] ?? camisetaBase;
  const contenedorRef = useRef(null);
  const startRef = useRef(null);
  const [target, setTarget] = useState(null);

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
      if (img) startRef.current = { tipo: "imagen", id: img.id, escala: img.escala ?? 1 };
    } else {
      startRef.current = { tipo: "texto", escala: escalaTexto ?? 1 };
    }
  };

  const onResize = ({ scale }) => {
    const s = startRef.current;
    if (!s) return;
    const nuevaEscala = clamp((s.escala ?? 1) * scale[0], 0.2, 4);
    if (s.tipo === "imagen") onImagenChange?.(s.id, { escala: nuevaEscala });
    else onTextoTransformChange?.({ escala: nuevaEscala });
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
  const mascara = {
    WebkitMaskImage: `url(${base})`,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskImage: `url(${base})`,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  };

  return (
    <div
      ref={contenedorRef}
      className="relative aspect-square w-full"
      style={{ isolation: "isolate" }}
    >
      {/* 1. Foto base del producto (blanca/gris, fondo transparente) */}
      <img
        src={base}
        alt={`Mockup ${tipo}`}
        draggable={false}
        className="block h-full w-full object-contain"
      />

      {/* 2. Color del producto, mezclado con "multiply" y recortado a la silueta */}
      {color && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: color, mixBlendMode: "multiply", ...mascara }}
        />
      )}

      {/* 3. Imágenes insertadas (subidas o generadas por IA), recortadas a la
             silueta. Con react-moveable se pueden arrastrar, redimensionar y
             rotar libremente (modo editor tipo Canva). */}
      <div className="absolute inset-0" style={mascara} onPointerDown={limpiarSeleccion}>
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
                transform: `translate(-50%, -50%) rotate(${imagen.rotacion ?? 0}deg) scale(${imagen.escala ?? 1})`,
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

      {/* 4. Texto opcional: también se puede arrastrar, redimensionar y rotar */}
      {texto.trim() && (
        <div className="pointer-events-none absolute inset-0" style={mascara}>
          <p
            ref={textoActivo ? setTarget : undefined}
            onPointerDown={seleccionarTexto}
            className="pointer-events-auto"
            style={{
              position: "absolute",
              left: `${posicionTexto.x}%`,
              top: `${posicionTexto.y}%`,
              color: colorTexto,
              fontSize: `${tamanoTexto}px`,
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

      {/* Control de editor libre (react-moveable): handles de arrastre, esquinas
          de redimensionado y asa de rotación sobre el elemento seleccionado. */}
      {interactivo && target && (
        <Moveable
          target={target}
          container={contenedorRef.current}
          draggable
          resizable
          rotatable
          keepRatio
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
