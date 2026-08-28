import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import {
  componerTexturaSolida,
  componerTexturaCamiseta,
} from "../../utils/texturaPrenda";

export const ESCALA_MIN_3D = 0.2;
export const ESCALA_MAX_3D = 3;

/* ------------------------------------------------------------------ */
/* Modelos glTF por tipo de producto                                   */

// Los modelos viven en /public/models porque sus .bin y texturas deben
// servirse tal cual junto al .gltf. Para agregar un producto nuevo basta con
// apuntar su tipo al archivo correspondiente.
//
// El modelo de mug es opcional: mientras frontend/public/models/mug.gltf no
// exista, el visor detecta el fallo de carga y cae automáticamente al mug
// procedural (ver LimiteErrorModelo más abajo).
const MODELOS_3D = {
  camiseta: "/models/tshirt.gltf",
  mug: "/models/mug.gltf",
};

// Precarga el modelo principal al montar el módulo para evitar parpadeo.
// El mug NO se precarga: puede no existir todavía.
useGLTF.preload(MODELOS_3D.camiseta);

const FACTOR_ROTACION = 0.01;

const DIMENSIONES_MUG = { radioSuperior: 1.1, radioInferior: 1.1, altura: 2.0 };

// Altura (en unidades de mundo) a la que se normaliza todo modelo glTF; es la
// misma caja para todos los productos para conservar el encuadre de cámara.
const ALTURA_MODELO = 2.6;

// Qué fracción de la circunferencia ocupa el diseño en el mug procedural.
const ANCHO_DISENO_MUG = 0.3;

// Ancho base del diseño en el mug glTF, como fracción de la textura de la capa
// (la textura cubre los 360° de la pared): 0.15 ≈ 54° de arco ≈ ~45% del ancho
// visible del pocillo de frente. Ajustar junto con el mockup 2D.
const ANCHO_IMAGEN_MUG = 0.15;

function configDisenoMug() {
  const { radioSuperior, altura } = DIMENSIONES_MUG;
  return {
    anchoFraccion: ANCHO_DISENO_MUG,
    circunferencia: 2 * Math.PI * radioSuperior,
    altura,
  };
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

// Textura procedural de tela (trama de hilos + ruido) usada como bump map para
// que el mug tenga relieve al iluminarse.
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

/* ------------------------------------------------------------------ */
/* Preparación de modelos glTF                                         */

// Extrae los triángulos de un mesh como geometría independiente en
// coordenadas de mundo (requiere matrixWorld al día). filtro(centroide)
// decide qué triángulos conservar (recibe {x, y, z} del centroide); null =
// todos. Devuelve null si ninguno pasa el filtro. No muta la geometría
// original compartida del glTF.
function extraerTriangulos(mesh, filtro) {
  const base = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry;
  const pos = base.attributes.position;
  const nor = base.attributes.normal;
  const matriz = mesh.matrixWorld;
  const matrizNormal = new THREE.Matrix3().getNormalMatrix(matriz);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  const posiciones = [];
  const normales = [];

  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i).applyMatrix4(matriz);
    b.fromBufferAttribute(pos, i + 1).applyMatrix4(matriz);
    c.fromBufferAttribute(pos, i + 2).applyMatrix4(matriz);
    if (filtro) {
      const centroide = {
        x: (a.x + b.x + c.x) / 3,
        y: (a.y + b.y + c.y) / 3,
        z: (a.z + b.z + c.z) / 3,
      };
      if (!filtro(centroide)) continue;
    }

    posiciones.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let j = 0; j < 3; j++) {
      if (nor) {
        n.fromBufferAttribute(nor, i + j).applyMatrix3(matrizNormal).normalize();
        normales.push(n.x, n.y, n.z);
      } else {
        normales.push(0, 1, 0);
      }
    }
  }

  if (!posiciones.length) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normales, 3));
  return geo;
}

// Combina varias geometrías (position + normal) en una sola.
function combinarGeometrias(partes) {
  const validas = partes.filter(Boolean);
  if (!validas.length) return null;
  if (validas.length === 1) return validas[0];

  const total = validas.reduce((suma, g) => suma + g.attributes.position.count, 0);
  const posiciones = new Float32Array(total * 3);
  const normales = new Float32Array(total * 3);

  let offset = 0;
  for (const parte of validas) {
    posiciones.set(parte.attributes.position.array, offset);
    normales.set(parte.attributes.normal.array, offset);
    offset += parte.attributes.position.array.length;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(posiciones, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normales, 3));
  return geo;
}

// Genera UVs de proyección plana lateral preservando aspecto (sin estirar).
// Antes u y v se mapeaban a 0-1 independientemente (anchoZ vs altoY) y el
// lienzo cuadrado se estiraba al rectángulo de la manga -> imagen estirada
// en laterales. Ahora se usa un cuadrado centrado (lado = max) y se centra
// la proyección para mantener la forma original como en frente/espalda.
function proyectarUvLateral(geo, ladoSigno) {
  const pos = geo.attributes.position;
  let minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const altoY = maxY - minY || 1;
  const anchoZ = maxZ - minZ || 1;
  const lado = Math.max(anchoZ, altoY) || 1;
  const offsetU = (lado - anchoZ) / 2;
  const offsetV = (lado - altoY) / 2;

  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const uRaw = ladoSigno > 0 ? maxZ - z : z - minZ;
    const u = (uRaw + offsetU) / lado;
    const v = (y - minY + offsetV) / lado;
    if (i === 0) {
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2));
    }
    geo.attributes.uv.setXY(i, u, v);
  }
  geo.attributes.uv.needsUpdate = true;
}

// Genera UVs de proyección plana frontal/trasera (eje Z) sobre la geometría
// fusionada del panel del torso. La caja proyectada completa ocupa la textura
// [0,1]²: así cada píxel de textura corresponde linealmente a una posición del
// torso y el lienzo 2D (% del cuadrado → % de AREA_IMPRIMIBLE_TORSO) cae en el
// mismo sitio relativo de la prenda, sin depender de los UVs arbitrarios del
// export. Frente (desdeAtras=false): u crece hacia +X, igual que la ve la
// cámara frontal; espalda: u crece hacia -X (vista desde atrás), evitando el
// espejo. v sigue a +Y (el alto del modelo ↔ fila superior del canvas vía el
// flipY por defecto de CanvasTexture), misma convención que proyectarUvLateral.
function proyectarUvFrontal(geo, desdeAtras = false) {
  const pos = geo.attributes.position;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const anchoX = maxX - minX || 1;
  const altoY = maxY - minY || 1;

  geo.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(new Float32Array(pos.count * 2), 2)
  );
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = desdeAtras ? (maxX - x) / anchoX : (x - minX) / anchoX;
    const v = (y - minY) / altoY;
    geo.attributes.uv.setXY(i, u, v);
  }
  geo.attributes.uv.needsUpdate = true;
}

// Prepara la camiseta (tshirt.gltf):
//  - materiales propios por instancia; el color se aplica a TODOS,
//  - cada mesh se clasifica por el nombre de su MATERIAL del glTF (Body_* /
//    Sleeves_*) y no por el nombre del mesh: el export de CLO agrupa las
//    primitivas en un Group y los Mesh hijos llegan sin nombre,
//  - el lado de cada manga (izquierda/derecha) y el panel frontal/trasero se
//    deducen de la posición del mesh (X y Z respectivamente),
//   - cuatro superficies imprimibles como CAPAS DE PROYECCIÓN independientes
//    (frente, espalda, manga izquierda y manga derecha): los diseños de manga
//    proyectan sobre TODA la silueta lateral (manga + costado + torso) para
//    que puedan desbordar de la manga sin cortarse en una costura,
//    los triángulos de cada cara se extraen a una geometría fusionada con UVs
//    planares generadas desde el mundo, de modo que la textura dibujada desde
//    las coordenadas (%) del editor 2D cae exactamente donde debe en el
//    modelo, sin depender de los UVs arbitrarios del export de CLO,
//  - centrado y escalado a ALTURA_MODELO.
// El clon comparte geometrías con la caché de useGLTF (no se disponen aquí).
function prepararModeloCamiseta(escenaOriginal) {
  const clon = escenaOriginal.clone(true);
  clon.updateMatrixWorld(true);

  const materialesGltf = {};
  clon.traverse((objeto) => {
    if (objeto.isMesh && objeto.material?.name) {
      materialesGltf[objeto.material.name] = objeto.material;
    }
  });

  // Nombres reales dentro de tshirt.gltf: Body_FRONT_2664 y Sleeves_FRONT_2669.
  const baseCuerpo =
    materialesGltf["Body_FRONT_2664"] ?? Object.values(materialesGltf)[0];
  const baseMangas = materialesGltf["Sleeves_FRONT_2669"] ?? baseCuerpo;

  const acabadoTela = { roughness: 0.85, metalness: 0 };
  const crearMaterial = (base) => {
    const material = base.clone();
    Object.assign(material, acabadoTela);
    material.map = null;
    // Ligera separación visual para que el decal no se vea "pegado" plano
    material.polygonOffset = false;
    return material;
  };

  // Materiales de COLOR base (sin estampado): el estampado vive en las capas
  // de proyección, así que el cuerpo completo se colorea liso.
  const matCuerpoFrente = crearMaterial(baseCuerpo);
  const matCuerpoLiso = crearMaterial(baseCuerpo);
  const matMangaColor = crearMaterial(baseMangas);
  const matRibbing = crearMaterial(baseCuerpo);

  let caja = new THREE.Box3().setFromObject(clon);
  const centro = caja.getCenter(new THREE.Vector3());
  const centroX = centro.x;
  const centroZ = centro.z;
  const tamano = caja.getSize(new THREE.Vector3());

  // Vista frontal (+Z hacia cámara): X negativo es la manga izquierda vista
  // por el usuario; Z positivo son los paneles delanteros.
  const esPanelFrontal = (cajaMesh) => {
    const centroMesh = cajaMesh.getCenter(new THREE.Vector3());
    return centroMesh.z >= centroZ;
  };

  const esRibbing = (objeto) =>
    (objeto.name ?? "").includes("Ribbing") ||
    (objeto.parent?.name ?? "").includes("Ribbing");

  // Clasificación por geometría única (el export duplica primitivas con los
  // mismos accessors; así no se procesan ni extraen varias veces).
  const geosProcesadas = new Map();

  clon.traverse((objeto) => {
    if (!objeto.isMesh) return;
    const nombreMaterial = objeto.material?.name ?? "";
    if (esRibbing(objeto)) {
      objeto.material = matRibbing;
      return;
    }

    const cajaMesh = new THREE.Box3().setFromObject(objeto);
    const esManga =
      nombreMaterial.includes("Sleeves") ||
      (objeto.name ?? "").includes("Sleeves");

    if (esManga) {
      objeto.material = matMangaColor;
    } else {
      const frontal = esPanelFrontal(cajaMesh);
      objeto.material = frontal ? matCuerpoFrente : matCuerpoLiso;
    }

    if (!geosProcesadas.has(objeto.geometry)) {
      geosProcesadas.set(objeto.geometry, {
        esManga,
        lado: cajaMesh.getCenter(new THREE.Vector3()).x < centroX ? -1 : 1,
        mesh: objeto,
      });
    }
  });

  // Extracción de triángulos ANTES de desplazar el modelo al origen.
  // - mangas: triángulos del material Sleeve del lado pedido + TODO el torso.
  //   La proyección lateral (u = profundidad Z, v = altura Y) es continua, así
  //   el diseño puede desbordar de la manga hacia el costado y el torso sin
  //   cortarse en una costura invisible; los paneles frontal y trasero ocupan
  //   rangos de Z disjuntos, así que no se pintan espejados entre sí,
  // - frente/espalda: triángulos del torso separados por el plano medio Z.
  clon.updateMatrixWorld(true);
  const extraerPartes = ({ mangaLado = 0, todo = false, triangulo = null }) => {
    const partes = [];
    for (const info of geosProcesadas.values()) {
      if (info.esManga) {
        if (mangaLado !== 0 && info.lado === mangaLado) {
          partes.push(extraerTriangulos(info.mesh, null));
        }
        continue;
      }
      if (!todo && !triangulo) continue;
      partes.push(extraerTriangulos(info.mesh, todo ? null : triangulo));
    }
    return combinarGeometrias(partes);
  };

  const geoCapaIzq = extraerPartes({ mangaLado: -1, todo: false });
  const geoCapaDer = extraerPartes({ mangaLado: 1, todo: false });
  const geoFrente = extraerPartes({ triangulo: (c) => c.z >= centroZ });
  const geoEspalda = extraerPartes({ triangulo: (c) => c.z < centroZ });

  const escala = ALTURA_MODELO / (tamano.y || 1);
  const raiz = new THREE.Group();
  clon.position.sub(centro);
  raiz.add(clon);
  raiz.scale.setScalar(escala);

  // Capas de proyección: geometría fusionada trasladada al origen del modelo,
  // UVs planares regeneradas y material transparente para no tapar el color
  // base de la prenda. La capa solo se hace visible cuando su ubicación tiene
  // contenido (ver efecto de texturas en ModeloGltf).
  const armarCapaProyeccion = (geoMerge, baseMaterial, proyectar) => {
    if (!geoMerge) return null;
    geoMerge.translate(-centro.x, -centro.y, -centro.z);
    proyectar(geoMerge);

    const material = crearMaterial(baseMaterial);
    Object.assign(material, {
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    material.map = null;

    const capa = new THREE.Mesh(geoMerge, material);
    capa.renderOrder = 2;
    capa.visible = false;
    raiz.add(capa);

    return { material, capa };
  };

  const capaFrente = armarCapaProyeccion(geoFrente, baseCuerpo, (g) =>
    proyectarUvFrontal(g, false)
  );
  const capaEspalda = armarCapaProyeccion(geoEspalda, baseCuerpo, (g) =>
    proyectarUvFrontal(g, true)
  );
  const capaIzquierda = armarCapaProyeccion(geoCapaIzq, baseMangas, (g) =>
    proyectarUvLateral(g, -1)
  );
  const capaDerecha = armarCapaProyeccion(geoCapaDer, baseMangas, (g) =>
    proyectarUvLateral(g, 1)
  );

  return {
    raiz,
    superficies: [
      {
        clave: "frente",
        material: capaFrente?.material ?? null,
        mesh: capaFrente?.capa ?? null,
        transparencia: true,
        silueta: false,
        conTexto: true,
        mapearTorso: true,
      },
      {
        clave: "espalda",
        material: capaEspalda?.material ?? null,
        mesh: capaEspalda?.capa ?? null,
        transparencia: true,
        silueta: false,
        conTexto: false,
        mapearTorso: true,
      },
      {
        clave: "mangaIzquierda",
        material: capaIzquierda?.material ?? null,
        mesh: capaIzquierda?.capa ?? null,
        transparencia: true,
        silueta: false,
        conTexto: false,
      },
      {
        clave: "mangaDerecha",
        material: capaDerecha?.material ?? null,
        mesh: capaDerecha?.capa ?? null,
        transparencia: true,
        silueta: false,
        conTexto: false,
      },
    ],
    materialesLisos: [matRibbing, matMangaColor, matCuerpoFrente, matCuerpoLiso],
    materialesTodos: [
      matCuerpoFrente,
      matCuerpoLiso,
      matMangaColor,
      matRibbing,
      capaFrente?.material,
      capaEspalda?.material,
      capaIzquierda?.material,
      capaDerecha?.material,
    ].filter(Boolean),
    geometriasPropias: [geoCapaIzq, geoCapaDer, geoFrente, geoEspalda].filter(
      Boolean
    ),
  };
}

// Preparación del mug (mug.gltf):
//  - el export de Sketchfab viene PARADO (altura en +Y, base abajo) con el asa
//    hacia -Z; se gira sobre Y para dejar el asa a +X y el frente a +Z (cámara),
//  - los UVs originales mezclan cuerpo, interior y asa en el mismo espacio, así
//    que el estampado NO se dibuja sobre ellos: se extraen los triángulos de la
//    pared exterior y se les generan UVs cilíndricas limpias (u = vuelta alrededor
//    del eje con el frente en u=0.5 y el asa en u=0.75, v = altura),
//  - dos capas de proyección coincidentes (frente y atrás), cada una con su
//    material/textura transparente, mismo patrón que las mangas de la camiseta,
//  - centrado y escalado a ALTURA_MODELO.
function prepararModeloMug(escenaOriginal) {
  const clon = escenaOriginal.clone(true);
  // El modelo ya viene vertical (altura +Y, boca arriba); Ry(-90°) pasa el asa
  // de -Z a +X y deja el frente de cara a la cámara (+Z). La rotación se
  // HORNEA en los vértices
  // (clonando las geometrías para no mutar la caché de useGLTF) y luego se
  // resetean las transformaciones de los nodos: así el mug queda parado sin
  // importar la jerarquía del export.
  clon.rotation.set(0, -Math.PI / 2, 0);
  clon.updateMatrixWorld(true);

  const geometriasHorneadas = [];
  clon.traverse((objeto) => {
    if (!objeto.isMesh || !objeto.geometry) return;
    const geo = objeto.geometry.clone();
    geo.applyMatrix4(objeto.matrixWorld);
    objeto.geometry = geo;
    geometriasHorneadas.push(geo);
  });
  clon.traverse((objeto) => {
    objeto.position.set(0, 0, 0);
    objeto.rotation.set(0, 0, 0);
    objeto.scale.set(1, 1, 1);
  });
  clon.updateMatrixWorld(true);

  const materialesGltf = new Map();
  clon.traverse((objeto) => {
    if (!objeto.isMesh || !objeto.material) return;
    if (!materialesGltf.has(objeto.material)) {
      const copia = objeto.material.clone();
      copia.map = null;
      Object.assign(copia, { roughness: 0.35, metalness: 0.05 });
      materialesGltf.set(objeto.material, copia);
    }
    objeto.material = materialesGltf.get(objeto.material);
  });

  const caja = new THREE.Box3().setFromObject(clon);
  const centro = caja.getCenter(new THREE.Vector3());
  const tamano = caja.getSize(new THREE.Vector3());

  // Centrar por el EJE del cuerpo y no por la caja completa: el centroide del
  // labio superior (borde del opening, simétrico alrededor del eje) da la
  // posición del eje, así el cuerpo queda centrado en el encuadre y solo el
  // asa sobresale a la derecha.
  {
    let maxY = -Infinity;
    const vertices = [];
    clon.traverse((objeto) => {
      if (!objeto.isMesh || !objeto.geometry?.attributes.position) return;
      objeto.updateWorldMatrix(true, false);
      const pos = objeto.geometry.attributes.position;
      const p = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(objeto.matrixWorld);
        if (p.y > maxY) maxY = p.y;
        vertices.push(p.x, p.y, p.z);
      }
    });
    const umbralLabio = maxY - (tamano.y || 1) * 0.02;
    let sumaX = 0, sumaZ = 0, n = 0;
    for (let i = 0; i < vertices.length; i += 3) {
      if (vertices[i + 1] >= umbralLabio) {
        sumaX += vertices[i];
        sumaZ += vertices[i + 2];
        n++;
      }
    }
    if (n > 0) {
      centro.x = sumaX / n;
      centro.z = sumaZ / n;
    }
  }

  // Pared exterior imprimible: triángulos cuyo centroide está en la banda
  // radial del cuerpo y cuya normal apunta HACIA AFUERA del eje (excluye la
  // pared interior hueca, la tapa superior y el fondo). Valores en unidades del
  // modelo original (radio del cuerpo ~0.06, asa hasta ~0.15).
  const R_MIN = 0.03;
  const R_MAX = 0.08;
  const geoPared = (() => {
    const posiciones = [];
    const normales = [];
    const matrizNormal = new THREE.Matrix3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const n = new THREE.Vector3();

    clon.traverse((objeto) => {
      if (!objeto.isMesh || !objeto.geometry) return;
      objeto.updateWorldMatrix(true, false);
      matrizNormal.getNormalMatrix(objeto.matrixWorld);
      const base = objeto.geometry.index
        ? objeto.geometry.toNonIndexed()
        : objeto.geometry;
      const pos = base.attributes.position;
      const nor = base.attributes.normal;

      for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i).applyMatrix4(objeto.matrixWorld);
        b.fromBufferAttribute(pos, i + 1).applyMatrix4(objeto.matrixWorld);
        c.fromBufferAttribute(pos, i + 2).applyMatrix4(objeto.matrixWorld);
        const cx = (a.x + b.x + c.x) / 3 - centro.x;
        const cz = (a.z + b.z + c.z) / 3 - centro.z;
        const radio = Math.hypot(cx, cz);
        if (radio < R_MIN || radio > R_MAX) continue;

        let nx = 0, ny = 0, nz = 0;
        if (nor) {
          for (let j = 0; j < 3; j++) {
            n.fromBufferAttribute(nor, i + j).applyMatrix3(matrizNormal);
            nx += n.x; ny += n.y; nz += n.z;
          }
        }
        // normal mayormente radial (no tapa superior ni fondo)...
        if (Math.abs(ny) > Math.hypot(nx, nz) * 0.6) continue;
        // ...y apuntando hacia afuera (excluye la pared interior)
        if (nor && nx * cx + nz * cz <= 0) continue;

        posiciones.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        for (let j = 0; j < 3; j++) {
          if (nor) {
            n.fromBufferAttribute(nor, i + j).applyMatrix3(matrizNormal).normalize();
            normales.push(n.x, n.y, n.z);
          } else {
            normales.push(0, 1, 0);
          }
        }
      }
      if (base !== objeto.geometry) base.dispose();
    });

    if (!posiciones.length) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(posiciones, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normales, 3));
    return geo;
  })();

  const escala = ALTURA_MODELO / (tamano.y || 1);
  const raiz = new THREE.Group();
  clon.position.sub(centro);
  raiz.add(clon);
  raiz.scale.setScalar(escala);

  // UVs cilíndricas: u = 0.5 + ángulo/(2π) con el frente (+Z) en 0.5 y el asa
  // (+X) en 0.75 (la costura u=0/1 queda atrás); v = altura normalizada.
  let uvPared = null;
  if (geoPared) {
    geoPared.translate(-centro.x, -centro.y, -centro.z);
    const pos = geoPared.attributes.position;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const alto = maxY - minY || 1;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const ang = Math.atan2(pos.getX(i), pos.getZ(i)); // 0=frente, ±π=atrás
      uvs[i * 2] = 0.5 + ang / (Math.PI * 2);
      uvs[i * 2 + 1] = (pos.getY(i) - minY) / alto;
    }
    // Triángulos que cruzan la costura u=0/1 (atrás): se les suma 1 a los
    // vértices con u bajo para que queden en un rango continuo y la textura no
    // se "estire" dando la vuelta completa. La geometría es no indexada, así
    // que cada triángulo tiene vértices propios.
    for (let i = 0; i < pos.count; i += 3) {
      const us = [uvs[i * 2], uvs[(i + 1) * 2], uvs[(i + 2) * 2]];
      if (Math.max(...us) - Math.min(...us) > 0.5) {
        for (let j = 0; j < 3; j++) {
          if (uvs[(i + j) * 2] < 0.5) uvs[(i + j) * 2] += 1;
        }
      }
    }
    geoPared.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    uvPared = geoPared;
  }

  // Capas coincidentes (frente y atrás): misma geometría, materiales/texturas
  // propios y transparentes para no tapar el color base ni entre sí.
  const crearCapa = () => {
    if (!uvPared || !materialesGltf.size) {
      return { material: null, capa: null };
    }
    const material = materialesGltf.values().next().value.clone();
    Object.assign(material, {
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
    material.map = null;
    const capa = new THREE.Mesh(uvPared, material);
    capa.renderOrder = 2;
    capa.visible = false;
    raiz.add(capa);
    return { material, capa };
  };

  const capaFrente = crearCapa();
  const capaAtras = crearCapa();

  return {
    raiz,
    superficies: [
      {
        clave: "frente",
        material: capaFrente.material,
        mesh: capaFrente.capa,
        transparencia: true,
        silueta: false,
        conTexto: true,
        anchoBase: ANCHO_IMAGEN_MUG,
        espejoX: false,
        espejoY: false,
      },
      {
        clave: "atras",
        material: capaAtras.material,
        mesh: capaAtras.capa,
        transparencia: true,
        silueta: false,
        conTexto: false,
        anchoBase: ANCHO_IMAGEN_MUG,
        espejoX: false,
        espejoY: false,
      },
    ],
    materialesLisos: [...materialesGltf.values()],
    materialesTodos: [
      ...materialesGltf.values(),
      capaFrente.material,
      capaAtras.material,
    ].filter(Boolean),
    geometriasPropias: [...geometriasHorneadas, ...(uvPared ? [uvPared] : [])],
  };
}

/* ------------------------------------------------------------------ */
/* Modelo glTF genérico (color uniforme + estampado por superficie)    */

const CARAS_VALIDAS = ["frente", "espalda", "mangaIzquierda", "mangaDerecha", "atras"];

function agruparDisenosPorCara(imagenes, unaSuperficie = false) {
  const grupos = {};
  for (const d of imagenes ?? []) {
    // "asa" es el nombre antiguo de la vista trasera del mug: se mapea para
    // no perder los diseños guardados antes del renombre.
    const caraNormalizada = d.cara === "asa" ? "atras" : d.cara;
    const cara =
      unaSuperficie || !CARAS_VALIDAS.includes(caraNormalizada)
        ? "frente"
        : caraNormalizada;
    (grupos[cara] ??= []).push(d);
  }
  return grupos;
}

function ModeloGltf({
  url,
  preparar,
  unaSuperficie = false,
  color,
  disenoUrl,
  imagenes = null,
  emojis = null,
  texto = "",
  colorTexto = "#111111",
  fuenteTexto,
  tamanoTexto = 32,
  esNegrita = false,
  esCursiva = false,
  esSubrayado = false,
  posicionTexto = { x: 50, y: 50 },
  rotacionTexto = 0,
  escalaTexto = 1,
  interactivo = false,
  imagenActivaId = null,
  imagenPendiente = null,
  onColocar,
  onMover,
  onSeleccionar,
  caraCamara,
  arrastrandoImagen = false,
  onArrastrarImagen,
  dragPreview = null,
}) {
  const { scene } = useGLTF(url);

  const preparado = useMemo(() => preparar(scene), [preparar, scene]);
  const texturasRef = useRef({});
  const generacionRef = useRef(0);

  // Disenos efectivos: array del Personalizador o diseño único (Generador usa
  // disenoUrl). Durante arrastre se excluye la imagen arrastrada de la textura
  // (se muestra vía preview sprite en alta calidad y sin regenerar canvas).
  const disenosEfectivos = useMemo(() => {
    let lista = null;
    if (imagenes && imagenes.length) lista = imagenes;
    else if (disenoUrl) return [{ url: disenoUrl, x: 50, y: 45, escala: 1, rotacion: 0 }];
    else return [];
    if (dragPreview?.id) {
      lista = lista.filter((im) => im.id !== dragPreview.id);
    }
    return lista;
  }, [imagenes, disenoUrl, dragPreview]);

  // Color + estampados en un solo efecto:
  //  - superficie sin contenido → color liso vía material.color,
  //  - superficie con contenido → su capa de proyección se hace visible con
  //    una textura transparente (solo el estampado es opaco); el color de la
  //    prenda vive siempre en los materiales base.
  // Sincrónico para seguimiento 1:1 del cursor; durante el arrastre se usa
  // baja resolución (256) + cache de imágenes para mantener 60fps sin retraso.
  useEffect(() => {
    let cancelado = false;
    const generacion = ++generacionRef.current;

    const aplicarColorLiso = (material) => {
      if (!material) return;
      if (material.map != null) {
        material.map = null;
        material.needsUpdate = true;
      }
      material.color.set(color);
    };

    const hayContenido =
      disenosEfectivos.length > 0 || Boolean(texto && texto.trim());

    if (!hayContenido) {
      preparado.materialesTodos.forEach(aplicarColorLiso);
      return () => {
        cancelado = true;
      };
    }

    const textosConfig = [];
    if (texto && texto.trim()) {
      textosConfig.push({
        contenido: texto,
        color: colorTexto,
        fuente: fuenteTexto,
        tamano: tamanoTexto,
        negrita: esNegrita,
        cursiva: esCursiva,
        subrayado: esSubrayado,
        x: posicionTexto.x,
        y: posicionTexto.y,
        rotacion: rotacionTexto,
        escala: escalaTexto,
      });
    }
    for (const em of emojis ?? []) {
      textosConfig.push({
        contenido: em.emoji,
        color: "#000000",
        fuente: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
        tamano: em.tamano ?? 48,
        x: em.x,
        y: em.y,
        rotacion: em.rotacion ?? 0,
        escala: em.escala ?? 1,
      });
    }

    preparado.materialesLisos.forEach(aplicarColorLiso);

    const grupos = agruparDisenosPorCara(disenosEfectivos, unaSuperficie);
    // 512 siempre para nitidez (256 se veía borroso en mangas/laterales y se
    // corrompía por filtrado). El cache + sin shadowBlur mantiene 60fps
    // incluso en drag; bajar a 256 no compensaba el blur.
    const tamanoTextura = 512;

      for (const superficie of preparado.superficies) {
        const material = superficie.material;
        if (!material) continue;

        const disenosSup = grupos[superficie.clave] ?? [];
        const textosSup = superficie.conTexto ? textosConfig : [];
        const hayContenidoSup = disenosSup.length > 0 || textosSup.length > 0;

        if (superficie.transparencia) {
          const capa = superficie.mesh;
          if (!hayContenidoSup) {
            if (material.map != null) {
              material.map = null;
              material.needsUpdate = true;
            }
            if (capa) capa.visible = false;
            continue;
          }

          componerTexturaCamiseta({
            color,
            disenos: disenosSup,
            textos: textosSup,
            tamano: tamanoTextura,
            recortarSilueta: superficie.silueta,
            espejoX: superficie.espejoX,
            espejoY: superficie.espejoY,
            fondoTransparente: true,
            anchoBase: superficie.anchoBase,
          })
            .then((textura) => {
              if (cancelado || generacion !== generacionRef.current) {
                textura.dispose();
                return;
              }
              material.transparent = true;
              material.alphaTest = 0.01;
              material.opacity = 1;
              material.map = textura;
              textura.minFilter = THREE.LinearFilter;
              textura.magFilter = THREE.LinearFilter;
              material.color.set("#ffffff");
              material.needsUpdate = true;
              if (capa) capa.visible = true;
              const anterior = texturasRef.current[superficie.clave];
              texturasRef.current[superficie.clave] = textura;
              if (anterior) anterior.dispose();
            })
            .catch(() => {});
          continue;
        }

        if (!hayContenidoSup) {
          aplicarColorLiso(material);
          continue;
        }

        componerTexturaCamiseta({
          color,
          disenos: disenosSup,
          textos: textosSup,
          tamano: tamanoTextura,
          recortarSilueta: superficie.silueta,
          espejoX: superficie.espejoX,
          espejoY: superficie.espejoY,
          mapearTorso: superficie.mapearTorso,
          anchoBase: superficie.anchoBase,
        })
          .then((textura) => {
            if (cancelado || generacion !== generacionRef.current) {
              textura.dispose();
              return;
            }
            material.map = textura;
            textura.minFilter = THREE.LinearFilter;
            textura.magFilter = THREE.LinearFilter;
            material.color.set("#ffffff");
            material.needsUpdate = true;
            const anterior = texturasRef.current[superficie.clave];
            texturasRef.current[superficie.clave] = textura;
            if (anterior) anterior.dispose();
          })
          .catch(() => {});
      }

    return () => {
      cancelado = true;
    };
  }, [color, disenosEfectivos, emojis, texto, colorTexto, fuenteTexto, tamanoTexto, esNegrita, esCursiva, esSubrayado, posicionTexto, rotacionTexto, escalaTexto, preparado, unaSuperficie, arrastrandoImagen]);

  // Limpieza: solo lo creado por esta instancia (materiales, texturas y
  // geometrías de las capas de proyección). Las geometrías del glTF
  // pertenecen a la caché de useGLTF y no se disponen.
  useEffect(() => {
    const materiales = preparado.materialesTodos;
    const geometrias = preparado.geometriasPropias ?? [];
    const texturas = texturasRef.current;
    return () => {
      materiales.forEach((material) => material.dispose());
      geometrias.forEach((geometria) => geometria.dispose());
      Object.values(texturas).forEach((textura) => textura?.dispose());
    };
  }, [preparado]);

  const texturaSombra = useMemo(() => crearTexturaSombra(), []);
  useEffect(() => () => texturaSombra.dispose(), [texturaSombra]);

  // Preview en alta calidad durante arrastre: sprite que sigue al cursor sin
  // regenerar CanvasTexture (0.1ms vs 8ms), se commitea a la textura final al soltar.
  const dragPreviewImagen = useMemo(() => {
    if (!dragPreview?.id || !imagenes?.length) return null;
    return imagenes.find((im) => im.id === dragPreview.id) ?? null;
  }, [dragPreview, imagenes]);

  const dragTexture = useMemo(() => {
    if (!dragPreview?.id) return null;
    const url = dragPreviewImagen?.url;
    if (!url) return null;
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
  }, [dragPreview?.id, dragPreviewImagen?.url]);

  useEffect(() => () => { if (dragTexture) dragTexture.dispose(); }, [dragTexture]);

  // Superficies clicables para colocar/mover diseños. Se usa la matriz mundial
  // completa (matrixWorld) en vez de position/scale locales para que la malla
  // invisible de raycasting coincida exactamente con el modelo visible
  // (preparado.raiz) incluso con jerarquías rotadas (mug) o escaladas.
  const superficiesVisibles = useMemo(
    () => preparado.superficies.filter((s) => s.mesh && s.mesh.geometry),
    [preparado.superficies]
  );

  const alPresionarSuperficie = (e, superficie) => {
    if (!interactivo) return;
    e.stopPropagation();
    // e.uv viene del raycaster de R3F; si no hay UV no se puede posicionar
    const uv = e.uv;
    if (!uv) return;
    // Normal en espacio mundo para orientar el preview pegado a la superficie
    let normal = null;
    if (e.face?.normal && e.object?.matrixWorld) {
      normal = new THREE.Vector3().copy(e.face.normal).transformDirection(e.object.matrixWorld).normalize().toArray();
    }
    const detalle = {
      uv: { u: uv.x, v: 1 - uv.y },
      posicion: e.point ? [e.point.x, e.point.y, e.point.z] : [0, 0, 0.18],
      normal,
      cara: superficie.clave,
    };
    // Prioridad: si hay imagen pendiente (plantilla/subida/IA), colocarla primero
    // aunque haya una imagen activa seleccionada. Antes el orden inverso hacía que
    // "aplicar plantilla" no funcionara si había una imagen activa.
    if (imagenPendiente && onColocar) {
      onColocar(detalle);
      return;
    }
    if (imagenActivaId && onMover) {
      if (onArrastrarImagen && e.type === "pointerdown") {
        onArrastrarImagen(true);
      }
      onMover(imagenActivaId, detalle);
    } else if (onSeleccionar) {
      onSeleccionar(superficie.clave);
    }
  };

  return (
    <group>
      <primitive object={preparado.raiz} />
      {/* Mallas invisibles para raycasting: usan matrixWorld completa para estar
          alineadas con el modelo visible, no solo position/scale locales */}
      {interactivo &&
        superficiesVisibles.map((s) => {
          s.mesh.updateWorldMatrix(true, false);
          return (
            <mesh
              key={s.clave}
              geometry={s.mesh.geometry}
              matrix={s.mesh.matrixWorld}
              matrixAutoUpdate={false}
              onPointerDown={(e) => alPresionarSuperficie(e, s)}
              onPointerMove={(e) => {
                if (arrastrandoImagen && imagenActivaId && onMover) {
                  alPresionarSuperficie(e, s);
                }
              }}
            >
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          );
        })}
      {/* Sombra de contacto suave debajo del producto */}
      <mesh
        rotation-x={-Math.PI / 2}
        position-y={-(ALTURA_MODELO / 2) - 0.08}
        renderOrder={-1}
      >
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={texturaSombra} transparent depthWrite={false} />
      </mesh>
      {/* Preview pegado a la superficie durante drag: plano orientado a la normal, sin regenerar canvas */}
      {dragPreview?.posicion && dragTexture && dragPreviewImagen && (() => {
        const w = 0.55 * (dragPreviewImagen.escala ?? 1);
        const h = w * ((dragPreviewImagen.naturalHeight || 1) / (dragPreviewImagen.naturalWidth || 1));
        const n = dragPreview.normal ? new THREE.Vector3(...dragPreview.normal) : new THREE.Vector3(0,0,1);
        const pos = new THREE.Vector3(...dragPreview.posicion).addScaledVector(n, 0.015);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), n.clone().normalize());
        return (
          <mesh position={pos} quaternion={quat} scale={[1,1,1]} renderOrder={3}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial map={dragTexture} transparent opacity={0.98} depthTest={false} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        );
      })()}
    </group>
  );
}

function IndicadorCarga() {
  const { active } = useProgress();
  if (!active) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(15,23,42,0.7)",
          color: "#e2e8f0",
          padding: "6px 14px",
          borderRadius: 9999,
          fontSize: 12,
        }}
      >
        Cargando modelo…
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visor 3D compartido (canvas, luces y órbita)                        */

function Visor3D({ children, arrastrandoImagen = false }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        cursor: "grab",
      }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context perdido, recuperando...");
          }, false);
        }}
        camera={{ position: [0, 0.15, 4.15], fov: 45, near: 0.1, far: 100 }}
        style={{ touchAction: "none" }}
      >
        <hemisphereLight args={["#ffffff", "#445566", 0.9]} />
        <directionalLight intensity={1.6} position={[2.5, 3.5, 4]} />
        <directionalLight intensity={1.0} position={[-2, 1.5, -3]} />

        {children}

        <OrbitControls
          makeDefault
          enabled={!arrastrandoImagen}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.3}
          maxDistance={9}
          minPolarAngle={Math.PI / 2 - 0.9}
          maxPolarAngle={Math.PI / 2 + 0.9}
        />
      </Canvas>
      <IndicadorCarga />
    </div>
  );
}

function VistaCamiseta(props) {
  return (
    <Visor3D arrastrandoImagen={props.arrastrandoImagen}>
      <Suspense fallback={null}>
        <ModeloGltf
          url={MODELOS_3D.camiseta}
          preparar={prepararModeloCamiseta}
          {...props}
        />
      </Suspense>
    </Visor3D>
  );
}

function VistaMugGltf(props) {
  return (
    <Visor3D arrastrandoImagen={props.arrastrandoImagen}>
      <Suspense fallback={null}>
        <ModeloGltf
          url={MODELOS_3D.mug}
          preparar={prepararModeloMug}
          {...props}
        />
      </Suspense>
    </Visor3D>
  );
}

// Si el glTF de un producto aún no existe (404 al cargar), el límite de error
// muestra el fallback en vez de romper la página.
class LimiteErrorModelo extends Component {
  constructor(props) {
    super(props);
    this.state = { fallo: false };
  }

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  render() {
    return this.state.fallo ? this.props.fallback : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* Mug procedural (fallback mientras no exista /models/mug.gltf)       */

function Mug3D({
  tipo,
  color,
  disenoUrl,
  imagenes = null,
  emojis = null,
  texto = "",
  colorTexto = "#111111",
  fuenteTexto,
  tamanoTexto = 32,
  esNegrita = false,
  esCursiva = false,
  esSubrayado = false,
  posicionTexto = { x: 50, y: 50 },
  rotacionTexto = 0,
  escalaTexto = 1,
}) {
  const canvasRef = useRef(null);
  const materialRef = useRef(null);
  const materialColorRef = useRef(null);
  const texturaRef = useRef(null);

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

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2.5, 3.5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(-2, 1.5, -3);
    scene.add(rim);

    const tela = crearTexturaTela();

    const prenda = new THREE.Group();
    const recursos = [tela];

    const { radioSuperior, radioInferior, altura } = DIMENSIONES_MUG;

    const geometry = new THREE.CylinderGeometry(
      radioSuperior,
      radioInferior,
      altura,
      64,
      1,
      true
    );
    recursos.push(geometry);

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.05,
    });
    materialRef.current = material;
    recursos.push(material);

    const cuerpo = new THREE.Mesh(geometry, material);
    // La textura envuelve el cilindro dejando el centro (u = 0.5) en la cara
    // trasera; con una rotación de PI lo dejamos mirando a la cámara.
    cuerpo.rotation.y = Math.PI;
    prenda.add(cuerpo);

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

    scene.add(prenda);

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
    sombra.position.y = -altura / 2 - 0.08;
    sombra.renderOrder = -1;
    scene.add(sombra);
    recursos.push(sombra.geometry, sombra.material, sombraTextura);

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
    // La escena se monta una sola vez: el componente se monta con una key por
    // tipo, así que no hay que re-ejecutar.
  }, []);
  useEffect(() => {
    let cancelado = false;

    const textosConfig = [];
    if (texto && texto.trim()) {
      textosConfig.push({
        contenido: texto,
        color: colorTexto,
        fuente: fuenteTexto,
        tamano: tamanoTexto,
        negrita: esNegrita,
        cursiva: esCursiva,
        subrayado: esSubrayado,
        x: posicionTexto.x,
        y: posicionTexto.y,
        rotacion: rotacionTexto,
        escala: escalaTexto,
      });
    }
    for (const em of emojis ?? []) {
      textosConfig.push({
        contenido: em.emoji,
        color: "#000000",
        fuente: '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif',
        tamano: em.tamano ?? 48,
        x: em.x,
        y: em.y,
        rotacion: em.rotacion ?? 0,
        escala: em.escala ?? 1,
      });
    }

    const disenosArray = imagenes && imagenes.length ? imagenes : null;

    const aplicar = (material, textura) => {
      if (!material || material.map === textura) return;
      const anterior = texturaRef.current;
      material.map = textura;
      material.needsUpdate = true;
      texturaRef.current = textura;
      if (anterior) anterior.dispose();
    };

    const trabajo = componerTexturaSolida(color, disenoUrl, {
      ...configDisenoMug(),
      textos: textosConfig,
      disenos: disenosArray,
    });

    trabajo
      .then((textura) => {
        if (cancelado) {
          textura.dispose();
          return;
        }
        aplicar(materialRef.current, textura);
        if (materialColorRef.current) materialColorRef.current.color.set(color);
      })
      .catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [tipo, color, disenoUrl, imagenes, emojis, texto, colorTexto, fuenteTexto, tamanoTexto, esNegrita, esCursiva, esSubrayado, posicionTexto, rotacionTexto, escalaTexto]);

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

/* ------------------------------------------------------------------ */
/* Dispatcher por tipo de producto                                     */

function Prenda3D(props) {
  const { tipo } = props;

  if (tipo === "camiseta") {
    return <VistaCamiseta {...props} />;
  }

  // Cualquier otro producto con modelo glTF definido usa el visor genérico;
  // si el archivo aún no existe en /public/models cae al visor procedural.
  const urlModelo = MODELOS_3D[tipo];
  if (urlModelo) {
    return (
      <LimiteErrorModelo fallback={<Mug3D {...props} />}>
        <VistaMugGltf {...props} />
      </LimiteErrorModelo>
    );
  }

  return <Mug3D {...props} />;
}

export default Prenda3D;
