import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaStar, FaShoppingCart, FaArrowLeft, FaUpload, FaSpinner } from "react-icons/fa";

import mug from "../assets/images/products/mug.png";
import { obtenerProductoPorId, obtenerVariantesDeProducto } from "../services/productService";
import { listarResenasPorProducto, crearResena, subirImagenResena } from "../services/resenaService";
import { listarCaracteristicasPorProducto } from "../services/caracteristicaService";
import { getErrorMessage } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

// Igual que en Catalogo.jsx: el backend solo da el nombre de la categoría,
const CATEGORY_META = {
  Mugs: { image: mug, color: "from-violet-500 to-purple-700" },
  Jarras: { image: mug, color: "from-amber-500 to-orange-700" },
};
const DEFAULT_META = { image: mug, color: "from-slate-500 to-slate-700" };

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function Estrellas({ calificacion = 0 }) {
  const llenas = Math.round(calificacion);
  return (
    <div className="flex gap-1 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <FaStar key={n} className={n <= llenas ? "" : "text-slate-700"} />
      ))}
    </div>
  );
}

function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agregarProducto } = useCart();
  const { usuario } = useAuth();

  const [producto, setProducto] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [caracteristicas, setCaracteristicas] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [tallaSel, setTallaSel] = useState(null);
  const [colorSel, setColorSel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de reseña
  const [calificacionSel, setCalificacionSel] = useState(0);
  const [comentarioSel, setComentarioSel] = useState("");
  const [archivoResena, setArchivoResena] = useState(null);
  const [archivoResenaPreview, setArchivoResenaPreview] = useState(null);
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [mensajeResena, setMensajeResena] = useState(null);
  const resenaFileInputRef = useRef(null);

  useEffect(() => {
    let activo = true;

    Promise.all([
      obtenerProductoPorId(id),
      listarResenasPorProducto(id).catch(() => []),
      listarCaracteristicasPorProducto(id).catch(() => []),
      obtenerVariantesDeProducto(id).catch(() => []),
    ])
      .then(
        ([productoData, resenasData, caracteristicasData, variantesData]) => {
          if (!activo) return;
          setProducto(productoData);
          setResenas(resenasData);
          setCaracteristicas(caracteristicasData);
          setVariantes(Array.isArray(variantesData) ? variantesData : []);
          // Auto-selección: si el producto tiene una sola talla o un solo color,
          // queda preseleccionado para que el usuario no tenga que elegir.
          if (Array.isArray(variantesData) && variantesData.length > 0) {
            const tallasUnicas = [...new Set(variantesData.map((v) => v.talla))];
            const coloresUnicos = [...new Set(variantesData.map((v) => v.color))];
            if (tallasUnicas.length === 1) setTallaSel(tallasUnicas[0]);
            if (coloresUnicos.length === 1) setColorSel(coloresUnicos[0]);
          }

          setLoading(false);
        }
      )
      .catch((err) => {
        if (!activo) return;
        setError(getErrorMessage(err));
        setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  const meta = useMemo(
    () => (producto ? CATEGORY_META[producto.categoria] ?? DEFAULT_META : DEFAULT_META),
    [producto]
  );

  // Variantes: tallas y colores disponibles, y la variante seleccionada.
  const tallas = useMemo(
    () => [...new Set(variantes.map((v) => v.talla))],
    [variantes]
  );
  const colores = useMemo(() => {
    const base = tallaSel
      ? variantes.filter((v) => v.talla === tallaSel)
      : variantes;
    return [...new Set(base.map((v) => v.color))];
  }, [variantes, tallaSel]);

  const varianteSel = useMemo(
    () =>
      variantes.find(
        (v) => v.talla === tallaSel && v.color === colorSel
      ) ?? null,
    [variantes, tallaSel, colorSel]
  );

  const precioMostrar = varianteSel ? varianteSel.precio : producto?.precio;
  const stockMostrar = varianteSel ? varianteSel.stock : producto?.stock;

  const recargarResenas = () => {
    listarResenasPorProducto(id)
      .then((data) => {
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.contenido)
            ? data.contenido
            : [];
        setResenas(lista);
      })
      .catch(() => {});
  };

  const handleSeleccionarArchivoResena = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setArchivoResena(file);
    if (archivoResenaPreview) URL.revokeObjectURL(archivoResenaPreview);
    setArchivoResenaPreview(URL.createObjectURL(file));
  };

  const handleQuitarArchivoResena = () => {
    setArchivoResena(null);
    if (archivoResenaPreview) URL.revokeObjectURL(archivoResenaPreview);
    setArchivoResenaPreview(null);
    if (resenaFileInputRef.current) resenaFileInputRef.current.value = "";
  };

  const handleEnviarResena = async () => {
    if (!usuario) {
      navigate("/login");
      return;
    }
    if (calificacionSel === 0) {
      setMensajeResena({ tipo: "error", texto: "Elige una calificación (1 a 5)." });
      return;
    }

    setEnviandoResena(true);
    setMensajeResena(null);
    try {
      let imagenUrl = null;
      if (archivoResena) {
        const subida = await subirImagenResena(archivoResena);
        imagenUrl = subida?.imagenUrl ?? null;
      }

      await crearResena({
        productoId: producto.id,
        calificacion: calificacionSel,
        comentario: comentarioSel.trim() || null,
        imagenUrl,
      });

      setCalificacionSel(0);
      setComentarioSel("");
      setArchivoResena(null);
      setArchivoResenaPreview(null);
      if (resenaFileInputRef.current) resenaFileInputRef.current.value = "";
      setMensajeResena({
        tipo: "ok",
        texto: "Gracias por tu reseña. Se publicará cuando sea aprobada.",
      });
      recargarResenas();
    } catch (err) {
      setMensajeResena({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setEnviandoResena(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-50 px-6 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="grid animate-pulse gap-10 md:grid-cols-2">
            <div className="h-96 rounded-3xl bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-4">
              <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="h-10 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="h-10 w-40 rounded-xl bg-gray-200 dark:bg-slate-700" />
              <div className="h-12 w-full rounded-xl bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !producto) {
    return (
      <section className="min-h-screen bg-gray-50 px-6 py-24 text-center text-gray-900 dark:bg-slate-950 dark:text-white">
        <p className="text-red-500 dark:text-red-400">{error || "Producto no encontrado."}</p>
        <button
          type="button"
          onClick={() => navigate("/catalogo")}
          className="mt-6 rounded-xl border border-gray-200 px-6 py-3 text-gray-600 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
        >
          Volver al catálogo
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/catalogo"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-indigo-600 dark:text-slate-400 dark:hover:text-cyan-300"
        >
          <FaArrowLeft /> Volver al catálogo
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Imagen */}
          <div>
            <div
              className={`flex h-96 items-center justify-center rounded-3xl bg-gradient-to-br ${meta.color}`}
            >
              <img
                src={producto.imagenUrl || meta.image}
                alt={producto.nombre}
                className="h-72 object-contain"
              />
            </div>

            {/* Miniaturas de vistas del producto */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="flex h-20 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400 transition hover:ring-2 hover:ring-indigo-300 dark:bg-slate-800 dark:text-slate-500 dark:hover:ring-cyan-500"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600 dark:bg-slate-800 dark:text-cyan-300">
              {producto.categoria}
            </span>

            <h1 className="mt-4 text-4xl font-bold">{producto.nombre}</h1>

            <div className="mt-3 flex items-center gap-3">
              <Estrellas calificacion={producto.calificacionPromedio ?? 0} />
              <span className="text-sm text-gray-500 dark:text-slate-400">
                ({producto.totalResenas ?? 0} reseñas)
              </span>
            </div>

            <p className="mt-6 text-4xl font-bold text-indigo-600 dark:text-cyan-300">
              {formatPrice(precioMostrar)}
            </p>

            {variantes.length > 0 && (
              <div className="mt-6 space-y-5">
                {/* Talla */}
                {tallas.length > 1 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Talla
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tallas.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTallaSel(t);
                            const coloresDeTalla = [
                              ...new Set(
                                variantes
                                  .filter((v) => v.talla === t)
                                  .map((v) => v.color)
                              ),
                            ];
                            setColorSel(
                              coloresDeTalla.length === 1 ? coloresDeTalla[0] : null
                            );
                          }}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                            tallaSel === t
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                              : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color */}
                {colores.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      Color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {colores.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColorSel(c)}
                          aria-label={`Color ${c}`}
                          title={c}
                          className={`flex h-9 items-center justify-center rounded-full border px-3 text-xs font-medium transition ${
                            colorSel === c
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-500/40"
                              : "border-gray-200 text-gray-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {varianteSel
                    ? `Stock disponible: ${stockMostrar}`
                    : "Selecciona una talla y un color."}
                </p>
              </div>
            )}

            <div className="my-8 border-t border-gray-200 dark:border-slate-800" />

            {producto.descripcion && (
              <>
                <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
                <p className="text-gray-500 dark:text-slate-400">{producto.descripcion}</p>
              </>
            )}

            {caracteristicas.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-lg font-semibold">Características</h2>
                <ul className="space-y-2 text-gray-500 dark:text-slate-400">
                  {caracteristicas.map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 dark:bg-cyan-400" />
                      {c.texto}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="my-8 border-t border-gray-200 dark:border-slate-800" />

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() =>
                  agregarProducto(producto, {
                    varianteId: varianteSel?.id ?? null,
                    precio: precioMostrar,
                  })
                }
                disabled={
                  (variantes.length > 0 && !varianteSel) || stockMostrar === 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                <FaShoppingCart />
                {(variantes.length > 0 && !varianteSel) || stockMostrar === 0
                  ? "Agotado"
                  : "Agregar al carrito"}
              </button>
            </div>
          </div>
        </div>

        {/* Reseñas */}
        <div className="mt-20">
          <h2 className="mb-6 text-2xl font-bold">Reseñas de clientes</h2>

          {/* Formulario para crear una reseña */}
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="mb-3 font-semibold text-gray-900 dark:text-white">
              ¿Cómo te pareció este producto?
            </p>

            <div className="mb-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCalificacionSel(n)}
                  aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                  className="text-2xl transition hover:scale-110"
                >
                  <FaStar className={n <= calificacionSel ? "text-amber-400" : "text-gray-300 dark:text-slate-600"} />
                </button>
              ))}
            </div>

            <textarea
              value={comentarioSel}
              onChange={(e) => setComentarioSel(e.target.value)}
              rows={3}
              placeholder="Cuéntanos tu experiencia (opcional)"
              className="mb-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
            />

            <div className="mb-4 flex items-center gap-3">
              {archivoResenaPreview ? (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-2 dark:border-slate-700">
                  <img
                    src={archivoResenaPreview}
                    alt="Foto de la reseña"
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleQuitarArchivoResena}
                    className="text-xs font-medium text-red-500 transition hover:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => resenaFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400"
                >
                  <FaUpload /> Agregar foto (opcional)
                </button>
              )}
              <input
                ref={resenaFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSeleccionarArchivoResena}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEnviarResena}
                disabled={enviandoResena || !usuario}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                {enviandoResena ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> Enviando...
                  </span>
                ) : usuario ? (
                  "Publicar reseña"
                ) : (
                  "Inicia sesión para reseñar"
                )}
              </button>
              {mensajeResena && (
                <p
                  className={`text-sm ${
                    mensajeResena.tipo === "error"
                      ? "text-red-500"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {mensajeResena.texto}
                </p>
              )}
            </div>
          </div>

          {resenas.length > 0 ? (
            <div className="space-y-4">
              {resenas.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.usuarioNombre ?? r.usuario}</p>
                    <Estrellas calificacion={r.calificacion} />
                  </div>
                  {r.comentario && (
                    <p className="mt-2 text-gray-500 dark:text-slate-400">{r.comentario}</p>
                  )}
                  {r.imagenUrl && (
                    <img
                      src={r.imagenUrl}
                      alt="Foto de la reseña"
                      className="mt-3 h-40 w-40 rounded-xl border border-gray-200 object-cover dark:border-slate-700"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
              Aún no hay reseñas para este producto. Sé el primero en opinar.
            </p>
          )}
        </div>

      </div>
    </section>
  );
}

export default DetalleProducto;
