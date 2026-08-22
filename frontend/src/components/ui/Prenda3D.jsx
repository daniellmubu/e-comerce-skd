import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  componerTexturaSolida,
  componerTexturaDiseno,
  crearShapeCamiseta,
} from "../../utils/texturaPrenda";

const FACTOR_ROTACION = 0.01;

// La camiseta es una prenda extruida (con grosor); el mug es un cilindro sólido.
const FORMAS = {
  camiseta: "plana",
  mug: "cilindro",
};

// Dimensiones en unidades del mundo.
const DIMENSIONES = {
  camiseta: { ancho: 2.6, alto: 2.6 },
  mug: { radioSuperior: 1.1, radioInferior: 1.1, altura: 2.0 },
};

// Grosor y bisel de la camiseta extruida (para que se vea como tela real).
const GROSOR_CAMISETA = 0.18;
const BISEL_CAMISETA = 0.06;
// El decal (diseños/texto) va justo delante de la cara frontal de la prenda.
const DECAL_Z = GROSOR_CAMISETA / 2 + BISEL_CAMISETA + 0.02;

// Mitad de la altura total de cada prenda (para ubicar la sombra).
function mediaAlturaDe(tipo) {
  if (tipo === "camiseta") return DIMENSIONES.camiseta.alto / 2;
  return DIMENSIONES.mug.altura / 2;
}

// Datos para envolver el diseño en cada cilindro.
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
  camiseta: { roughness: 0.85, metalness: 0 },
  mug: { roughness: 0.35, metalness: 0.05 },
};

// Qué fracción de la circunferencia ocupa el diseño en cada cilindro.
const ANCHO_DISENO_CILINDRO = {
  mug: 0.3,
};

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

// Textura procedural de tela (trama de hilos + ruido) usada como bump map para
// que la prenda tenga relieve de algodón al iluminarse.
function crearTexturaTela() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 1;
  const paso = 8;
  for (let i = 0; i <= size; i += paso) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const imageData = ctx.getImageData(0, 0, size, size);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() * 2 - 1) * 22;
    const v = Math.max(0, Math.min(255, data[i] + n));
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);

  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
  return textura;
}

function Prenda3D({
  tipo,
  color,
  disenoUrl,
  imagenes = null,
  texto = "",
  colorTexto = "#111111",
  tamanoTexto = 32,
  posicionTexto = { x: 50, y: 50 },
}) {
  const canvasRef = useRef(null);
  // Material al que se le asigna la textura (cuerpo del mug o decal de la camiseta).
  const materialRef = useRef(null);
  // Material de color sólido (asa del mug o cuerpo de la camiseta).
  const materialColorRef = useRef(null);
  const texturaRef = useRef(null);

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
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-2, 1.5, -3);
    scene.add(rim);

    const tela = crearTexturaTela();

    const esCilindro = FORMAS[tipo] === "cilindro";
    const acabado = ACABADOS[tipo] ?? ACABADOS.camiseta;
    const prenda = new THREE.Group();
    const recursos = [tela];

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

      const material = new THREE.MeshStandardMaterial({ ...acabado });
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
          color: 0xffffff,
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
      // Camiseta "buzo": forma extruida con grosor real y bisel redondeado,
      // más un decal frontal con los diseños y el texto.
      const shape = crearShapeCamiseta();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: GROSOR_CAMISETA,
        bevelEnabled: true,
        bevelThickness: BISEL_CAMISETA,
        bevelSize: BISEL_CAMISETA,
        bevelSegments: 4,
        curveSegments: 32,
      });
      geometry.center();
      recursos.push(geometry);

      const materialCuerpo = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        ...acabado,
        bumpMap: tela,
        bumpScale: 0.03,
      });
      materialColorRef.current = materialCuerpo;
      recursos.push(materialCuerpo);

      const cuerpo = new THREE.Mesh(geometry, materialCuerpo);
      prenda.add(cuerpo);

      // Decal frontal (diseños + texto), transparente, delante de la cara frontal.
      const decalGeometry = new THREE.PlaneGeometry(2.6, 2.6);
      recursos.push(decalGeometry);

      const materialDecal = new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: 0.6,
        metalness: 0,
        depthWrite: false,
      });
      materialRef.current = materialDecal;
      recursos.push(materialDecal);

      const decal = new THREE.Mesh(decalGeometry, materialDecal);
      decal.position.z = DECAL_Z;
      prenda.add(decal);
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

    // Rotación manual (arrastre) en X e Y, y zoom con la rueda.
    let arrastrando = false;
    let ultimaX = 0;
    let ultimaY = 0;

    const onMouseDown = (e) => {
      arrastrando = true;
      ultimaX = e.clientX;
      ultimaY = e.clientY;
      canvas.style.cursor = "grabbing";
    };
    const onMouseMove = (e) => {
      if (!arrastrando) return;
      const dx = e.clientX - ultimaX;
      const dy = e.clientY - ultimaY;
      ultimaX = e.clientX;
      ultimaY = e.clientY;
      prenda.rotation.y += dx * FACTOR_ROTACION;
      prenda.rotation.x += dy * FACTOR_ROTACION * 0.6;
      prenda.rotation.x = Math.max(-0.9, Math.min(0.9, prenda.rotation.x));
    };
    const onMouseUp = () => {
      arrastrando = false;
      canvas.style.cursor = "grab";
    };
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 1 / 1.1;
      camera.position.z = Math.max(2.6, Math.min(9, camera.position.z * factor));
    };

    const onTouchStart = (e) => {
      if (!e.touches.length) return;
      arrastrando = true;
      ultimaX = e.touches[0].clientX;
      ultimaY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (!arrastrando || !e.touches.length) return;
      const dx = e.touches[0].clientX - ultimaX;
      const dy = e.touches[0].clientY - ultimaY;
      ultimaX = e.touches[0].clientX;
      ultimaY = e.touches[0].clientY;
      prenda.rotation.y += dx * FACTOR_ROTACION;
      prenda.rotation.x += dy * FACTOR_ROTACION * 0.6;
      prenda.rotation.x = Math.max(-0.9, Math.min(0.9, prenda.rotation.x));
    };
    const onTouchEnd = () => {
      arrastrando = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
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
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      recursos.forEach((r) => r.dispose());
      if (texturaRef.current) texturaRef.current.dispose();
      renderer.dispose();
    };
    // La escena se monta una sola vez: la geometría depende de `tipo`, pero el
    // componente se monta con una key por tipo, así que no hay que re-ejecutar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenera la textura cuando cambia el producto, el color, el diseño o el texto.
  useEffect(() => {
    let cancelado = false;
    const esCilindro = FORMAS[tipo] === "cilindro";

    const textoConfig =
      texto && texto.trim()
        ? {
            contenido: texto,
            color: colorTexto,
            tamano: tamanoTexto,
            x: posicionTexto.x,
            y: posicionTexto.y,
          }
        : null;

    const disenosArray = imagenes && imagenes.length ? imagenes : null;

    const aplicar = (material, textura, ref) => {
      if (!material || material.map === textura) return;
      const anterior = ref.current;
      material.map = textura;
      material.needsUpdate = true;
      ref.current = textura;
      if (anterior) anterior.dispose();
    };

    let trabajo;
    if (esCilindro) {
      const config = configDisenoCilindro(tipo);
      trabajo = componerTexturaSolida(color, disenoUrl, {
        ...config,
        texto: textoConfig,
        disenos: disenosArray,
      });
    } else {
      const disenosDecal =
        disenosArray ??
        (disenoUrl
          ? [{ url: disenoUrl, x: 50, y: 45, escala: 1, rotacion: 0 }]
          : null);
      trabajo = componerTexturaDiseno(disenosDecal, textoConfig);
    }

    trabajo
      .then((textura) => {
        if (cancelado) {
          textura.dispose();
          return;
        }
        aplicar(materialRef.current, textura, texturaRef);
        if (materialColorRef.current) materialColorRef.current.color.set(color);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [tipo, color, disenoUrl, imagenes, texto, colorTexto, tamanoTexto, posicionTexto]);

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
