import camisetaBase from "../../assets/images/products/base/camiseta-base.png";
import mugBase from "../../assets/images/products/base/mug-base.png";

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
}) {
  const base = IMAGENES[tipo] ?? camisetaBase;
  const overlay = OVERLAY[tipo] ?? OVERLAY.camiseta;

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
    <div className="relative aspect-square w-full" style={{ isolation: "isolate" }}>
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
             en el área imprimible (con rotación y escala). El "multiply" hace
             que el fondo blanco de la imagen desaparezca y se funda con la
             prenda, simulando sublimación. */}
      {disenoUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ mixBlendMode: "multiply", ...mascara }}
        >
          <img
            src={disenoUrl}
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

      {/* 4. Texto opcional, también recortado a la silueta */}
      {texto.trim() && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={mascara}
        >
          <p
            style={{
              color: colorTexto,
              fontSize: `${tamanoTexto}px`,
              fontWeight: 600,
              lineHeight: 1.1,
              textAlign: "center",
              transform: `rotate(${rotacion}deg) scale(${escala})`,
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
