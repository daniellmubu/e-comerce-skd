import { useEffect, useRef, useState } from "react";
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

// Posición (desde arriba) y ancho relativo del diseño dentro de cada mockup.
// Las imágenes base miden 500x500, así que estos valores son fracciones de esa
// caja y se reutilizan igual que el overlay del resto del proyecto.
const OVERLAY = {
  camiseta: { top: 0.3, width: 0.52 },
  mug: { top: 0.34, width: 0.4 },
};

function PrendaMockup({
  tipo = "camiseta",
  color = null,
  disenoUrl = null,
  rotacion = 0,
  escala = 1,
  texto = "",
  colorTexto = "#111111",
  tamanoTexto = 32,
  posicionTexto = { x: 50, y: 50 },
  onPosicionTextoChange,
}) {
  const base = IMAGENES[tipo] ?? camisetaBase;
  const overlay = OVERLAY[tipo] ?? OVERLAY.camiseta;

  // Quita el fondo blanco del diseño para poder dibujarlo SIN mezcla de color.
  // Antes el diseño usaba "multiply", que mezclaba sus colores con el de la
  // prenda y producía un tercer color (ej: diseño azul sobre camiseta roja
  // terminaba negro).
  const [disenoProcesado, setDisenoProcesado] = useState({ url: null, dataUrl: null });

  useEffect(() => {
    if (!disenoUrl) return undefined;

    let activo = true;

    procesarDiseno(disenoUrl)
      .then(({ dataUrl }) => {
        if (activo) setDisenoProcesado({ url: disenoUrl, dataUrl });
      })
      .catch(() => {
        // Si no se pudo procesar (CORS, etc.), usamos la original tal cual.
        if (activo) setDisenoProcesado({ url: disenoUrl, dataUrl: disenoUrl });
      });

    return () => {
      activo = false;
    };
  }, [disenoUrl]);

  // Solo mostramos el diseño procesado si corresponde a la URL actual; así
  // evitamos dibujar un diseño viejo mientras se procesa el nuevo.
  const disenoAMostrar = disenoProcesado.url === disenoUrl ? disenoProcesado.dataUrl : null;

  // Posición del texto (en % del área del mockup). Arranca centrado y el
  // usuario lo puede arrastrar a cualquier parte de la prenda.
  const contenedorRef = useRef(null);
  const arrastreRef = useRef(null);

  const iniciarArrastreTexto = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastreRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: posicionTexto.x,
      posY: posicionTexto.y,
    };
  };

  const moverTexto = (e) => {
    const arrastre = arrastreRef.current;
    const contenedor = contenedorRef.current;
    if (!arrastre || !contenedor) return;

    const rect = contenedor.getBoundingClientRect();
    const dx = ((e.clientX - arrastre.startX) / rect.width) * 100;
    const dy = ((e.clientY - arrastre.startY) / rect.height) * 100;

    if (onPosicionTextoChange) {
      onPosicionTextoChange({
        x: Math.min(100, Math.max(0, arrastre.posX + dx)),
        y: Math.min(100, Math.max(0, arrastre.posY + dy)),
      });
    }
  };

  const terminarArrastreTexto = () => {
    arrastreRef.current = null;
  };

  // Máscara con la silueta del producto: recorta la capa de color y el diseño
  // para que nada se salga de la prenda (así se ve "estampado" y no flotando).
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

      {/* 3. Diseño generado por IA o subido, recortado a la silueta y colocado
             en el área imprimible (con rotación y escala). El fondo blanco ya
             se volvió transparente, así que se dibuja con sus colores reales
             sin mezclarse con el color de la prenda. */}
      {disenoAMostrar && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={mascara}
        >
          <img
            src={disenoAMostrar}
            alt="Diseño aplicado"
            draggable={false}
            style={{
              position: "absolute",
              left: "50%",
              top: `${overlay.top * 100}%`,
              width: `${overlay.width * 100}%`,
              transform: `translateX(-50%) rotate(${rotacion}deg) scale(${escala})`,
              transformOrigin: "top center",
            }}
          />
        </div>
      )}

      {/* 4. Texto opcional: se puede arrastrar a cualquier parte de la prenda */}
      {texto.trim() && (
        <div
          className="pointer-events-none absolute inset-0"
          style={mascara}
        >
          <p
            onPointerDown={iniciarArrastreTexto}
            onPointerMove={moverTexto}
            onPointerUp={terminarArrastreTexto}
            onPointerCancel={terminarArrastreTexto}
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
              transform: `translate(-50%, -50%) rotate(${rotacion}deg) scale(${escala})`,
            }}
          >
            {texto}
          </p>
        </div>
      )}
    </div>
  );
}

export default PrendaMockup;
