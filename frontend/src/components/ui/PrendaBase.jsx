import { useRef, useState } from "react";
import mugBase from "../../assets/images/products/base/mug-base.png";

const IMAGENES = {
  mug: mugBase,
};

const ANGULO_MAX = 35;
const FACTOR = 0.25;

function clampAngulo(valor) {
  return Math.max(-ANGULO_MAX, Math.min(ANGULO_MAX, valor));
}

function PrendaBase({ tipo, color }) {
  const [angulo, setAngulo] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const dragRef = useRef(null);

  const iniciarArrastre = (clientX) => {
    dragRef.current = { startX: clientX, startAngulo: angulo };
    setArrastrando(true);
  };

  const actualizarArrastre = (clientX) => {
    if (!dragRef.current) return;
    const delta = clientX - dragRef.current.startX;
    setAngulo(clampAngulo(dragRef.current.startAngulo + delta * FACTOR));
  };

  const terminarArrastre = () => {
    dragRef.current = null;
    setArrastrando(false);
    setAngulo(0);
  };

  const onMouseDown = (e) => iniciarArrastre(e.clientX);
  const onMouseMove = (e) => actualizarArrastre(e.clientX);
  const onMouseUp = () => terminarArrastre();

  const onTouchStart = (e) => {
    const touch = e.touches[0];
    if (touch) iniciarArrastre(touch.clientX);
  };
  const onTouchMove = (e) => {
    const touch = e.touches[0];
    if (touch) actualizarArrastre(touch.clientX);
  };
  const onTouchEnd = () => terminarArrastre();

  const intensidadSombra = Math.abs(angulo) / ANGULO_MAX;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        perspective: "1000px",
      }}
    >
      {/* Sombra sutil debajo de la prenda */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "2%",
          width: "70%",
          height: "12%",
          transform: `translateX(calc(-50% + ${-angulo * 0.5}px)) scaleX(${
            1 + intensidadSombra * 0.1
          })`,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
          opacity: 0.35 + intensidadSombra * 0.45,
          transition: "transform 0.4s ease-out, opacity 0.4s ease-out",
          pointerEvents: "none",
        }}
      />

      <div
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateY(${angulo}deg)`,
          transition: arrastrando ? "none" : "transform 0.4s ease-out",
          cursor: "grab",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        {/* 1. La foto real del producto, en blanco/gris */}
        <img
          src={IMAGENES[tipo]}
          alt={`Prenda base: ${tipo}`}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* 2. Capa de color encima, mezclada con "multiply" para conservar
               sombras y pliegues de la foto de abajo */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: color,
            mixBlendMode: "multiply",
            WebkitMaskImage: `url(${IMAGENES[tipo]})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: `url(${IMAGENES[tipo]})`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        />
      </div>
    </div>
  );
}

export default PrendaBase;
