import { useEffect, useRef } from "react";
import * as THREE from "three";
import { componerTextura, componerTexturaSolida } from "../../utils/texturaPrenda";

const FACTOR_ROTACION = 0.01;

// La camiseta es una lámina curvada; el mug es un cilindro sólido.
const FORMAS = {
  camiseta: "plana",
  mug: "cilindro",
};

// Dimensiones en unidades del mundo.
const DIMENSIONES = {
  camiseta: { ancho: 2.6, alto: 2.6 },
  mug: { radioSuperior: 1.1, radioInferior: 1.1, altura: 2.0 },
};

// Mitad de la altura total de cada prenda (para ubicar la sombra).
function mediaAlturaDe(tipo) {
  if (tipo === "camiseta") return DIMENSIONES.camiseta.alto / 2;
  return DIMENSIONES.mug.altura / 2;
}

// Datos para envolver el diseño en cada cilindro: la circunferencia y la altura
// de la zona imprimible y qué fracción de esa circunferencia ocupa el diseño.
function configDisenoCilindro(tipo) {
  const { radioSuperior, altura } = DIMENSIONES[tipo];
  return {
    anchoFraccion: ANCHO_DISENO_CILINDRO[tipo] ?? 0.3,
    circunferencia: 2 * Math.PI * radioSuperior,
    altura,
  };
}

// Acabado del material según la prenda (cerámica o tela).
const ACABADOS = {
  camiseta: { roughness: 0.6, metalness: 0 },
  mug: { roughness: 0.4, metalness: 0.05 },
};

// Qué fracción de la circunferencia ocupa el diseño en cada cilindro.
const ANCHO_DISENO_CILINDRO = {
  mug: 0.3,
};

// Curvatura de la lámina de la camiseta para que no parezca un papel plano.
const PROFUNDIDAD_CURVA = 0.16;

function crearPlanoCurvo(ancho, alto, segmentos, profundidad) {
  const geo = new THREE.PlaneGeometry(ancho, alto, segmentos, segmentos);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const t = x / (ancho / 2);
    pos.setZ(i, -profundidad * t * t);
  }
  geo.computeVertexNormals();
  return geo;
}

function crearTexturaSombra() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.5)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function Prenda3D({ tipo, color, disenoUrl }) {
  const canvasRef = useRef(null);
  const materialRef = useRef(null);
  const materialFrontalRef = useRef(null);
  const materialTraseroRef = useRef(null);
  const materialColorRef = useRef(null);
  const texturaRef = useRef(null);
  const texturaTraseraRef = useRef(null);

  // Escena de three.js: se monta una sola vez. El componente se monta con una
  // key por tipo de prenda, así que la geometría es fija durante toda su vida.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.15, 4.6);
    camera.lookAt(0, 0, 0);

    // Iluminación más suave y realista: hemisférica + luz principal + relleno.
    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 3.5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9);
    rim.position.set(-2, 1.5, -3);
    scene.add(rim);

    const acabado = ACABADOS[tipo] ?? ACABADOS.camiseta;
    const fabricaMaterial = () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        side: THREE.FrontSide,
        ...acabado,
      });

    const esCilindro = FORMAS[tipo] === "cilindro";
    const prenda = new THREE.Group();
    const recursos = [];

    if (esCilindro) {
      const { radioSuperior, radioInferior, altura } = DIMENSIONES[tipo];

      const geometry = new THREE.CylinderGeometry(
        radioSuperior,
        radioInferior,
        altura,
        64,
        1,
        true
      );
      recursos.push(geometry);

      const material = fabricaMaterial();
      materialRef.current = material;
      recursos.push(material);

      const cuerpo = new THREE.Mesh(geometry, material);
      // La textura envuelve el cilindro dejando el centro (u = 0.5) en la cara
      // trasera; con una rotación de PI lo dejamos mirando a la cámara.
      cuerpo.rotation.y = Math.PI;
      prenda.add(cuerpo);

      // Tapas para que el cilindro se vea sólido y no hueco.
      const materialTapa = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.6,
        metalness: 0.05,
      });
      recursos.push(materialTapa);
      const geometriaTapa = new THREE.CircleGeometry(radioSuperior, 64);
      recursos.push(geometriaTapa);

      const tapaSuperior = new THREE.Mesh(geometriaTapa, materialTapa);
      tapaSuperior.rotation.x = -Math.PI / 2;
      tapaSuperior.position.y = altura / 2;
      prenda.add(tapaSuperior);

      const tapaInferior = new THREE.Mesh(geometriaTapa, materialTapa);
      tapaInferior.rotation.x = Math.PI / 2;
      tapaInferior.position.y = -altura / 2;
      prenda.add(tapaInferior);

      // Asa para el mug (un aro que asoma por el costado).
      if (tipo === "mug") {
        const materialAsa = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.4,
          metalness: 0.05,
        });
        materialColorRef.current = materialAsa;
        recursos.push(materialAsa);

        const asa = new THREE.Mesh(
          new THREE.TorusGeometry(0.6, 0.12, 16, 48),
          materialAsa
        );
        asa.position.set(radioSuperior + 0.15, 0, 0);
        prenda.add(asa);
      }
    } else {
      // Camiseta: lámina curvada con cara delantera (diseño) y trasera (lisa).
      const { ancho, alto } = DIMENSIONES[tipo];
      const geometry = crearPlanoCurvo(ancho, alto, 48, PROFUNDIDAD_CURVA);
      recursos.push(geometry);

      const materialFrontal = fabricaMaterial();
      materialFrontalRef.current = materialFrontal;
      recursos.push(materialFrontal);

      const materialTrasero = fabricaMaterial();
      materialTraseroRef.current = materialTrasero;
      recursos.push(materialTrasero);

      const frente = new THREE.Mesh(geometry, materialFrontal);
      frente.position.z = 0.02;
      const reverso = new THREE.Mesh(geometry, materialTrasero);
      reverso.rotation.y = Math.PI;
      reverso.position.z = -0.02;

      prenda.add(frente);
      prenda.add(reverso);
    }

    scene.add(prenda);

    // Sombra de contacto suave debajo de la prenda.
    const sombraTextura = crearTexturaSombra();
    const sombra = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: sombraTextura,
        transparent: true,
        depthWrite: false,
      })
    );
    sombra.rotation.x = -Math.PI / 2;
    const mediaAltura = mediaAlturaDe(tipo);
    sombra.position.y = -mediaAltura - 0.08;
    sombra.renderOrder = -1;
    scene.add(sombra);
    recursos.push(sombra.geometry, sombra.material, sombraTextura);

    // Rotación manual (arrastre) sin límite de grados (360° completos).
    let arrastrando = false;
    let ultimaX = 0;

    const onMouseDown = (e) => {
      arrastrando = true;
      ultimaX = e.clientX;
      canvas.style.cursor = "grabbing";
    };
    const onMouseMove = (e) => {
      if (!arrastrando) return;
      const dx = e.clientX - ultimaX;
      ultimaX = e.clientX;
      prenda.rotation.y += dx * FACTOR_ROTACION;
    };
    const onMouseUp = () => {
      arrastrando = false;
      canvas.style.cursor = "grab";
    };

    const onTouchStart = (e) => {
      if (!e.touches.length) return;
      arrastrando = true;
      ultimaX = e.touches[0].clientX;
    };
    const onTouchMove = (e) => {
      if (!arrastrando || !e.touches.length) return;
      const dx = e.touches[0].clientX - ultimaX;
      ultimaX = e.touches[0].clientX;
      prenda.rotation.y += dx * FACTOR_ROTACION;
    };
    const onTouchEnd = () => {
      arrastrando = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    const ajustarTamano = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    ajustarTamano();
    const resizeObserver = new ResizeObserver(ajustarTamano);
    resizeObserver.observe(canvas);

    let animacionId;
    const animar = () => {
      animacionId = requestAnimationFrame(animar);
      renderer.render(scene, camera);
    };
    animar();

    return () => {
      cancelAnimationFrame(animacionId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      recursos.forEach((r) => r.dispose());
      // Al desmontar queremos desechar la ÚLTIMA textura aplicada (guardada en
      // el ref), no la del render inicial; por eso se lee el ref en el cleanup.
      /* eslint-disable react-hooks/exhaustive-deps */
      if (texturaRef.current) texturaRef.current.dispose();
      if (texturaTraseraRef.current) texturaTraseraRef.current.dispose();
      /* eslint-enable react-hooks/exhaustive-deps */
      renderer.dispose();
    };
    // La escena se monta una sola vez: la geometría depende de `tipo`, pero el
    // componente se monta con una key por tipo, así que no hay que re-ejecutar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenera la textura cuando cambia el producto, el color o el diseño.
  useEffect(() => {
    let cancelado = false;
    const esCilindro = FORMAS[tipo] === "cilindro";

    const aplicar = (material, textura, ref) => {
      if (!material || material.map === textura) return;
      const anterior = ref.current;
      material.map = textura;
      material.needsUpdate = true;
      ref.current = textura;
      if (anterior) anterior.dispose();
    };

    let frontal;
    let trasera = null;

    if (esCilindro) {
      const config = configDisenoCilindro(tipo);
      frontal = componerTexturaSolida(color, disenoUrl, config);
    } else {
      frontal = componerTextura(tipo, color, disenoUrl, { recortar: true });
      trasera = componerTextura(tipo, color, null);
    }

    Promise.all([frontal, trasera])
      .then(([texFrontal, texTrasera]) => {
        if (cancelado) {
          texFrontal.dispose();
          if (texTrasera) texTrasera.dispose();
          return;
        }
        if (esCilindro) {
          aplicar(materialRef.current, texFrontal, texturaRef);
          if (materialColorRef.current) materialColorRef.current.color.set(color);
        } else {
          aplicar(materialFrontalRef.current, texFrontal, texturaRef);
          aplicar(materialTraseroRef.current, texTrasera, texturaTraseraRef);
        }
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [tipo, color, disenoUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: "grab",
        touchAction: "none",
      }}
    />
  );
}

export default Prenda3D;
