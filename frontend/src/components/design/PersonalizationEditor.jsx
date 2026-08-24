import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import {
  FaUpload,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
  FaShoppingCart,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

import camisetaBase from "../../assets/images/products/base/camiseta-base.png";
import mugBase from "../../assets/images/products/base/mug-base.png";
import { subirDiseno, agregarDisenoAlCarrito } from "../../services/disenoService";
import { obtenerOCrearCarrito } from "../../services/carritoService";
import { getErrorMessage } from "../../services/api";

const MOCKUPS = { camiseta: camisetaBase, mug: mugBase };

// Tamaño del lienzo Konva (px). Se usa también para calcular el DPI efectivo.
const STAGE_SIZE = 600;

// Ancho real de impresión que representa el lienzo (pulgadas). Sirve para
// estimar el DPI: DPI = naturalWidth / (anchoRenderizadoEnPulgadas).
const PRINT_WIDTH_INCHES = 12;

// Por debajo de este DPI la imagen, una vez impresa, se vería pixelada.
const DPI_MINIMO = 150;

// Ancho inicial (px) de una imagen recién agregada dentro del lienzo.
const ANCHO_INICIAL = STAGE_SIZE * 0.4;

function calcularDpi(naturalWidth, nodeWidth) {
  if (!naturalWidth || !nodeWidth) return 0;
  const pulgadas = (nodeWidth / STAGE_SIZE) * PRINT_WIDTH_INCHES;
  return pulgadas > 0 ? naturalWidth / pulgadas : 0;
}

// Carga una imagen (dataURL/blob/URL remota) como <img> para poder dibujarla
// en Konva y conocer sus dimensiones originales.
function cargarImagen(url) {
  return new Promise((resolve) => {
    const img = new window.Image();
    if (typeof url === "string" && url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () =>
      resolve({ img, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Hook que mantiene en caché el HTMLImageElement de una URL y avisa cuando
// ya está listo (necesario para dibujarlo en un Konva.Image). Devuelve null
// mientras carga (o si la URL es nula).
function useKonvaImage(url) {
  const [loaded, setLoaded] = useState({ url: null, image: null });

  useEffect(() => {
    if (!url) return undefined;

    let activo = true;
    const img = new window.Image();
    if (typeof url === "string" && url.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      if (activo) setLoaded({ url, image: img });
    };
    img.onerror = () => {
      if (activo) setLoaded({ url, image: null });
    };
    img.src = url;

    return () => {
      activo = false;
    };
  }, [url]);

  return loaded.url === url ? loaded.image : null;
}

// Capa individual (imagen) dibujada en el lienzo y editable con Transformer.
function DesignImageNode({ layer, image, onSelect, onTransformEnd, onRef }) {
  return (
    <KonvaImage
      ref={(node) => onRef(layer.id, node)}
      name={layer.id}
      image={image}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation ?? 0}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onTransformEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

const PersonalizationEditor = forwardRef(function PersonalizationEditor(
  { productoId, tipo = "camiseta", onGuardado },
  ref
) {
  const [layers, setLayers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alerta, setAlerta] = useState(null);

  const stageRef = useRef(null);
  const designLayerRef = useRef(null);
  const trRef = useRef(null);
  const nodeRefs = useRef({});
  const fileInputRef = useRef(null);
  const layersRef = useRef(layers);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  const mockupSrc = MOCKUPS[tipo] ?? camisetaBase;
  const mockupImage = useKonvaImage(mockupSrc);

  // Rectángulo donde se dibuja el mockup (ajustado para caber en el lienzo).
  const mockupRect = useMemo(() => {
    if (!mockupImage) return null;
    const escala = Math.min(
      STAGE_SIZE / mockupImage.width,
      STAGE_SIZE / mockupImage.height
    );
    const width = mockupImage.width * escala;
    const height = mockupImage.height * escala;
    return {
      x: (STAGE_SIZE - width) / 2,
      y: (STAGE_SIZE - height) / 2,
      width,
      height,
    };
  }, [mockupImage]);

  const registerNode = useCallback((id, node) => {
    if (node) nodeRefs.current[id] = node;
    else delete nodeRefs.current[id];
  }, []);

  // Conecta el Transformer al nodo seleccionado (se ejecuta después de montar
  // los nodos, cuando el ref ya está registrado).
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, layers.length]);

  const seleccionar = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // Al terminar de arrastrar/redimensionar/rotar, "hornea" la escala dentro de
  // width/height y actualiza el estado + recalcula el DPI.
  const commitTransform = useCallback((e) => {
    const node = e.target;
    const id = node.name();
    if (!id) return;

    const sx = node.scaleX();
    const sy = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const width = Math.max(20, node.width() * sx);
    const height = Math.max(20, node.height() * sy);
    const capa = layersRef.current.find((l) => l.id === id);
    const dpi = calcularDpi(capa?.naturalWidth, width);

    setLayers((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              x: node.x(),
              y: node.y(),
              width,
              height,
              rotation: node.rotation(),
              lowQuality: dpi > 0 && dpi < DPI_MINIMO,
            }
          : l
      )
    );
  }, []);

  const handleArchivos = useCallback(
    async (archivos) => {
      if (!archivos.length) return;
      setProcesando(true);
      setAlerta(null);

      const nuevas = [];
      for (const archivo of archivos) {
        const url = URL.createObjectURL(archivo);
        const cargada = await cargarImagen(url);
        if (!cargada) {
          URL.revokeObjectURL(url);
          continue;
        }
        const height =
          ANCHO_INICIAL * (cargada.naturalHeight / cargada.naturalWidth);
        const offset = Math.round((Math.random() - 0.5) * 24);
        nuevas.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url,
          naturalWidth: cargada.naturalWidth,
          naturalHeight: cargada.naturalHeight,
          x: STAGE_SIZE / 2 + offset,
          y: STAGE_SIZE / 2 + offset,
          width: ANCHO_INICIAL,
          height,
          rotation: 0,
          lowQuality: false,
        });
      }

      if (nuevas.length) {
        setLayers((prev) => [...prev, ...nuevas]);
        setSelectedId(nuevas[nuevas.length - 1].id);
      } else {
        setAlerta({
          tipo: "error",
          texto: "No se pudieron cargar las imágenes seleccionadas.",
        });
      }

      setProcesando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const onFileChange = useCallback(
    (e) => {
      handleArchivos(Array.from(e.target.files ?? []));
    },
    [handleArchivos]
  );

  const eliminar = useCallback((id) => {
    setLayers((prev) => {
      const capa = prev.find((l) => l.id === id);
      if (capa?.url?.startsWith("blob:")) URL.revokeObjectURL(capa.url);
      return prev.filter((l) => l.id !== id);
    });
    setSelectedId((actual) => (actual === id ? null : actual));
  }, []);

  const traerAlFrente = useCallback((id) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [capa] = next.splice(idx, 1);
      next.push(capa);
      return next;
    });
  }, []);

  const enviarAlFondo = useCallback((id) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [capa] = next.splice(idx, 1);
      next.unshift(capa);
      return next;
    });
  }, []);

  const limpiar = useCallback(() => {
    setLayers((prev) => {
      prev.forEach((l) => {
        if (l.url?.startsWith("blob:")) URL.revokeObjectURL(l.url);
      });
      return [];
    });
    setSelectedId(null);
    setAlerta(null);
  }, []);

  // Exporta SOLO la capa de diseño (fondo transparente, sin el mockup) como
  // un File PNG, listo para subirlo al backend.
  const exportarPNG = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const layer = designLayerRef.current;
        if (!layer) {
          reject(new Error("El lienzo no está listo todavía."));
          return;
        }
        const canvas = layer.toCanvas({ pixelRatio: 2 });
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("No se pudo exportar el diseño."));
              return;
            }
            const file = new File([blob], `diseno-usuario-${Date.now()}.png`, {
              type: "image/png",
            });
            resolve(file);
          },
          "image/png"
        );
      }),
    []
  );

  // Mapea el status HTTP a un mensaje amigable; si no, usa el del backend.
  const mensajeError = useCallback((err) => {
    const status = err?.response?.status;
    if (status === 400) return "La imagen no es válida o excede el tamaño permitido.";
    if (status === 403) return "Inicia sesión para guardar tu diseño.";
    if (status === 404) return "El producto o el diseño ya no existe.";
    return getErrorMessage(err);
  }, []);

  const guardarYAgregarAlCarrito = useCallback(async () => {
    if (!layers.length) {
      setAlerta({ tipo: "error", texto: "Sube al menos una imagen para guardar." });
      return;
    }
    if (!productoId) {
      setAlerta({ tipo: "error", texto: "Elige un producto antes de guardar." });
      return;
    }

    setIsSaving(true);
    setAlerta(null);

    try {
      const file = await exportarPNG();
      const diseno = await subirDiseno({ file, productoId });

      const carrito = await obtenerOCrearCarrito();
      await agregarDisenoAlCarrito({
        carritoId: carrito.id,
        productoId,
        disenoId: diseno.id,
        cantidad: 1,
      });

      setAlerta({ tipo: "ok", texto: "Diseño guardado y agregado al carrito." });
      onGuardado?.(diseno);
    } catch (err) {
      setAlerta({ tipo: "error", texto: mensajeError(err) });
    } finally {
      setIsSaving(false);
    }
  }, [layers.length, productoId, exportarPNG, onGuardado, mensajeError]);

  useImperativeHandle(
    ref,
    () => ({
      exportarPNG,
      guardarYAgregarAlCarrito,
      limpiar,
      hayDiseno: layers.length > 0,
    }),
    [exportarPNG, guardarYAgregarAlCarrito, limpiar, layers.length]
  );

  const capaSeleccionada = layers.find((l) => l.id === selectedId) ?? null;
  const hayCalidadBaja = layers.some((l) => l.lowQuality);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Panel de capas / herramientas */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 dark:text-slate-400">
          Subir imágenes
        </h2>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={procesando}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-8 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
        >
          {procesando ? (
            <>
              <FaSpinner className="animate-spin" /> Cargando...
            </>
          ) : (
            <>
              <FaUpload /> Click para subir (varias a la vez)
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFileChange}
          className="hidden"
        />

        <div className="my-5 border-t border-gray-200 dark:border-slate-800" />

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400">
            Capas ({layers.length})
          </h2>
          {layers.length > 0 && (
            <button
              type="button"
              onClick={limpiar}
              className="text-xs font-medium text-red-500 transition hover:text-red-400"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {layers.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Sube imágenes para empezar. Arrástralas, redimensiónalas y rótalas
            sobre la prenda.
          </p>
        ) : (
          <ul className="space-y-2">
            {/* Se muestra del frente hacia el fondo (inverso al orden de render). */}
            {[...layers].reverse().map((capa) => (
              <li
                key={capa.id}
                className={`flex items-center gap-2 rounded-lg border p-2 transition ${
                  capa.id === selectedId
                    ? "border-indigo-400 bg-indigo-50 dark:border-cyan-400 dark:bg-cyan-500/10"
                    : "border-gray-200 dark:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => seleccionar(capa.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <img
                    src={capa.url}
                    alt="Miniatura de capa"
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                  <span className="truncate text-xs text-gray-700 dark:text-slate-200">
                    {capa.lowQuality && (
                      <FaExclamationTriangle
                        className="mr-1 inline text-amber-500"
                        title={`DPI bajo: ${Math.round(
                          calcularDpi(capa.naturalWidth, capa.width)
                        )}`}
                      />
                    )}
                    {Math.round(capa.width)}×{Math.round(capa.height)} px
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => traerAlFrente(capa.id)}
                    title="Traer al frente"
                    className="rounded p-1 text-gray-400 transition hover:text-indigo-500 dark:hover:text-cyan-400"
                  >
                    <FaArrowUp className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => enviarAlFondo(capa.id)}
                    title="Enviar al fondo"
                    className="rounded p-1 text-gray-400 transition hover:text-indigo-500 dark:hover:text-cyan-400"
                  >
                    <FaArrowDown className="text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(capa.id)}
                    title="Eliminar capa"
                    className="rounded p-1 text-gray-400 transition hover:text-red-500"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {capaSeleccionada && capaSeleccionada.lowQuality && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            La imagen seleccionada está muy pequeña para imprimir con buena
            calidad (por debajo de {DPI_MINIMO} DPI). Usa una imagen de mayor
            resolución o redúcela de tamaño.
          </p>
        )}
      </div>

      {/* Lienzo */}
      <div>
        <div className="relative flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 dark:border-slate-800 dark:bg-slate-900">
          {layers.length > 0 && (
            <button
              type="button"
              onClick={limpiar}
              className="absolute right-4 top-4 z-10 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
            >
              Quitar diseño
            </button>
          )}

          <div className="w-full max-w-[540px] p-4">
            <Stage
              ref={stageRef}
              width={STAGE_SIZE}
              height={STAGE_SIZE}
              onMouseDown={(e) => {
                // Click en el fondo (no sobre un nodo) deselecciona.
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
              style={{ maxWidth: "100%", height: "auto" }}
            >
              {/* Fondo: mockup de la prenda (no se incluye en la exportación). */}
              <Layer listening={false}>
                {mockupImage && mockupRect && (
                  <KonvaImage image={mockupImage} {...mockupRect} />
                )}
              </Layer>

              {/* Capa de diseño (solo esto se exporta). */}
              <Layer ref={designLayerRef}>
                {layers.map((capa) => (
                  <DesignImage
                    key={capa.id}
                    capa={capa}
                    onSelect={() => seleccionar(capa.id)}
                    onTransformEnd={commitTransform}
                    onRef={registerNode}
                  />
                ))}

                <Transformer
                  ref={trRef}
                  rotateEnabled
                  keepRatio
                  borderStroke="#6366f1"
                  borderDash={[4, 4]}
                  anchorStroke="#6366f1"
                  anchorFill="#ffffff"
                  anchorSize={10}
                  boundBoxFunc={(oldBox, newBox) =>
                    newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
                  }
                />
              </Layer>
            </Stage>
          </div>
        </div>

        {hayCalidadBaja && (
          <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-amber-600 dark:text-amber-400">
            <FaExclamationTriangle />
            Algunas imágenes tienen baja resolución para impresión.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={guardarYAgregarAlCarrito}
            disabled={isSaving || !layers.length || !productoId}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <FaShoppingCart /> Guardar y Agregar al Carrito
              </>
            )}
          </button>
        </div>

        {alerta && (
          <p
            className={`mt-3 text-center text-sm ${
              alerta.tipo === "error"
                ? "text-red-500"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {alerta.texto}
          </p>
        )}
      </div>
    </div>
  );
});

// Sub-componente que resuelve el HTMLImageElement de cada capa (hook por capa).
function DesignImage({ capa, onSelect, onTransformEnd, onRef }) {
  const image = useKonvaImage(capa.url);

  if (!image) return null;

  return (
    <DesignImageNode
      layer={capa}
      image={image}
      onSelect={onSelect}
      onTransformEnd={onTransformEnd}
      onRef={onRef}
    />
  );
}

export default PersonalizationEditor;
