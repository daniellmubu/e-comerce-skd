import { useEffect, useRef, useState } from "react";
import {
  FaHandshake,
  FaSpinner,
  FaCheckCircle,
  FaRedoAlt,
  FaPaperPlane,
  FaClipboardList,
  FaUpload,
  FaTimes,
  FaShoppingCart,
} from "react-icons/fa";

import { listarProductos } from "../services/productService";
import {
  crearSolicitud,
  listarMisSolicitudes,
  aprobarSolicitud,
  solicitarCambios,
} from "../services/solicitudDisenoService";
import { obtenerOCrearCarrito } from "../services/carritoService";
import { agregarDisenoAlCarrito } from "../services/disenoService";
import { useCart } from "../context/CartContext";
import { useTopicRealtime } from "../hooks/useTopicRealtime";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

const ESTADOS = {
  RECIBIDA: {
    label: "Recibida",
    classes:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  EN_DISENO: {
    label: "En diseño",
    classes:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  PROPUESTA_ENVIADA: {
    label: "Propuesta enviada",
    classes:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  CAMBIOS_SOLICITADOS: {
    label: "Cambios solicitados",
    classes:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  LISTA_PARA_PRODUCCION: {
    label: "Lista para producción",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

function SolicitarDiseno() {
  const { abrirCarrito, recargarCarrito } = useCart();
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const fileInputRef = useRef(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [errorSolicitudes, setErrorSolicitudes] = useState(null);

  const [accionandoId, setAccionandoId] = useState(null);
  const [agregandoId, setAgregandoId] = useState(null);
  const [cambiosAbiertosId, setCambiosAbiertosId] = useState(null);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    let activo = true;

    Promise.all([listarProductos().catch(() => []), listarMisSolicitudes()])
      .then(([prods, solicitudesData]) => {
        if (!activo) return;
        setProductos(Array.isArray(prods) ? prods : []);
        setSolicitudes(Array.isArray(solicitudesData) ? solicitudesData : []);
        setCargandoSolicitudes(false);
      })
      .catch((err) => {
        if (!activo) return;
        setErrorSolicitudes(getErrorMessage(err));
        setCargandoSolicitudes(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const recargarSolicitudes = () => {
    listarMisSolicitudes()
      .then((data) => {
        setSolicitudes(Array.isArray(data) ? data : []);
        setErrorSolicitudes(null);
      })
      .catch((err) => setErrorSolicitudes(getErrorMessage(err)));
  };

  // Notificaciones en vivo: se recarga la lista cuando cambia el estado de
  // alguna solicitud (ej: el diseñador envía una propuesta).
  const topicsSolicitudes = solicitudes.map((s) => `/topic/solicitudes/${s.id}`);
  useTopicRealtime(topicsSolicitudes, recargarSolicitudes);

  const handleAgregarAlCarrito = async (s) => {
    if (!s.disenoId || !s.productoId) return;
    setAgregandoId(s.id);
    setMensaje(null);
    try {
      const carrito = await obtenerOCrearCarrito();
      await agregarDisenoAlCarrito({
        carritoId: carrito.id,
        productoId: s.productoId,
        disenoId: s.disenoId,
        cantidad: 1,
      });
      await recargarCarrito();
      abrirCarrito();
      setMensaje({ tipo: "ok", texto: "Diseño agregado al carrito." });
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setAgregandoId(null);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!productoId || !descripcion.trim()) {
      setMensaje({
        tipo: "error",
        texto: "Elige un producto y escribe una descripción.",
      });
      return;
    }

    setEnviando(true);
    setMensaje(null);
    try {
      await crearSolicitud({
        productoId: Number(productoId),
        descripcion: descripcion.trim(),
        file: archivo,
      });
      setDescripcion("");
      setProductoId("");
      setArchivo(null);
      setArchivoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMensaje({
        tipo: "ok",
        texto: "Solicitud enviada. Te avisaremos cuando tengamos una propuesta.",
      });
      recargarSolicitudes();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setEnviando(false);
    }
  };

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    setArchivo(file);

    if (archivoPreview) URL.revokeObjectURL(archivoPreview);
    setArchivoPreview(URL.createObjectURL(file));
  };

  const handleQuitarArchivo = () => {
    setArchivo(null);
    if (archivoPreview) URL.revokeObjectURL(archivoPreview);
    setArchivoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAprobar = async (id) => {
    setAccionandoId(id);
    try {
      await aprobarSolicitud(id);
      setMensaje({ tipo: "ok", texto: "Diseño aprobado. Pasó a producción." });
      recargarSolicitudes();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setAccionandoId(null);
    }
  };

  const handleCambios = async (id) => {
    if (!motivo.trim()) {
      setMensaje({ tipo: "error", texto: "Escribe qué quieres cambiar." });
      return;
    }
    setAccionandoId(id);
    try {
      await solicitarCambios(id, motivo.trim());
      setMotivo("");
      setCambiosAbiertosId(null);
      setMensaje({
        tipo: "ok",
        texto: "Cambios solicitados. Nuestro equipo preparará una nueva propuesta.",
      });
      recargarSolicitudes();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setAccionandoId(null);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Diseño asistido
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Pide ayuda a un diseñador
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-500 dark:text-slate-400">
            Cuéntanos tu idea y una persona real de SKD la convertirá en un
            diseño para ti. Te avisaremos con una propuesta lista para aprobar.
          </p>
        </div>

        {/* Formulario de solicitud */}
        <form
          onSubmit={handleCrear}
          className="mb-12 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur"
        >
          <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold">
            <FaHandshake className="text-indigo-500 dark:text-cyan-400" />
            Nueva solicitud
          </h2>

          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            ¿Qué producto quieres personalizar?
          </label>
          <select
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
            className="mb-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
          >
            <option value="">Selecciona un producto...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.categoria ? ` — ${p.categoria}` : ""}
              </option>
            ))}
          </select>

          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Describe tu idea
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Ej: Quiero el logo de mi empresa con una mascota y el nombre en letras grandes, en tonos azules."
            className="mb-5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
          />

          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Imagen de referencia (opcional)
          </label>
          {archivoPreview ? (
            <div className="mb-5 flex items-center gap-4 rounded-xl border border-gray-200 p-3 dark:border-slate-700">
              <img
                src={archivoPreview}
                alt="Referencia"
                className="h-20 w-20 rounded-lg border border-gray-200 object-cover dark:border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-700 dark:text-slate-200">
                  {archivo?.name}
                </p>
                <button
                  type="button"
                  onClick={handleQuitarArchivo}
                  className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500 transition hover:text-red-400"
                >
                  <FaTimes /> Quitar imagen
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-5 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-6 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              <FaUpload />
              Sube una imagen de lo que quieres (logo, foto, idea...)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleSeleccionarArchivo}
            className="hidden"
          />

          <button
            type="submit"
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            {enviando ? (
              <>
                <FaSpinner className="animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <FaPaperPlane /> Enviar solicitud
              </>
            )}
          </button>

          {mensaje && (
            <p
              className={`mt-4 text-center text-sm ${
                mensaje.tipo === "error"
                  ? "text-red-500"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {mensaje.texto}
            </p>
          )}
        </form>

        {/* Mis solicitudes */}
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <FaClipboardList className="text-indigo-500 dark:text-cyan-400" />
          Mis solicitudes
        </div>

        {cargandoSolicitudes && (
          <div className="flex justify-center py-16">
            <Loading label="Cargando tus solicitudes..." />
          </div>
        )}

        {!cargandoSolicitudes && errorSolicitudes && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{errorSolicitudes}</p>
            <button
              type="button"
              onClick={recargarSolicitudes}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargandoSolicitudes && !errorSolicitudes && solicitudes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaHandshake className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>Aún no tienes solicitudes de diseño.</p>
            <p className="mt-1 text-sm">
              Envía tu primera solicitud con el formulario de arriba.
            </p>
          </div>
        )}

        {!cargandoSolicitudes && !errorSolicitudes && solicitudes.length > 0 && (
          <div className="space-y-5">
            {solicitudes.map((s) => {
              const estado = ESTADOS[s.estado] ?? {
                label: s.estado,
                classes:
                  "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
              };

              return (
                <div
                  key={s.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur"
                >
                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.classes}`}
                        >
                          {estado.label}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                          {s.producto}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        {s.descripcion}
                      </p>
                      {s.mensajeAdmin && (
                        <p className="mt-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                          <strong>Diseñador:</strong> {s.mensajeAdmin}
                        </p>
                      )}
                      {s.motivoCambios && (
                        <p className="mt-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
                          <strong>Tus cambios:</strong> {s.motivoCambios}
                        </p>
                      )}
                    </div>

                    {/* Referencia del cliente + propuesta/diseño aprobado */}
                    {(s.referenciaImagenUrl ||
                      s.propuestaImagenUrl ||
                      s.disenoImagenUrl) && (
                      <div className="flex shrink-0 gap-3">
                        {s.referenciaImagenUrl && (
                          <figure className="text-center">
                            <img
                              src={s.referenciaImagenUrl}
                              alt="Tu referencia"
                              className="h-40 w-40 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                            />
                            <figcaption className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                              Tu referencia
                            </figcaption>
                          </figure>
                        )}
                        {(s.propuestaImagenUrl || s.disenoImagenUrl) && (
                          <figure className="text-center">
                            <img
                              src={s.disenoImagenUrl || s.propuestaImagenUrl}
                              alt="Propuesta de diseño"
                              className="h-40 w-40 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                            />
                            <figcaption className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                              Propuesta
                            </figcaption>
                          </figure>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Acciones según estado */}
                  {s.estado === "PROPUESTA_ENVIADA" && (
                    <div className="border-t border-gray-200 p-5 dark:border-slate-800">
                      {cambiosAbiertosId === s.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows={3}
                            placeholder="¿Qué quieres cambiar de la propuesta?"
                            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                          />
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleCambios(s.id)}
                              disabled={accionandoId === s.id}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                            >
                              {accionandoId === s.id ? (
                                <FaSpinner className="animate-spin" />
                              ) : (
                                <FaRedoAlt />
                              )}
                              Confirmar cambios
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCambiosAbiertosId(null);
                                setMotivo("");
                              }}
                              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 dark:border-slate-700 dark:text-slate-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => handleAprobar(s.id)}
                            disabled={accionandoId === s.id}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {accionandoId === s.id ? (
                              <FaSpinner className="animate-spin" />
                            ) : (
                              <FaCheckCircle />
                            )}
                            Aprobar diseño
                          </button>
                          <button
                            type="button"
                            onClick={() => setCambiosAbiertosId(s.id)}
                            disabled={accionandoId === s.id}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-orange-400 hover:text-orange-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-orange-500/50 dark:hover:text-orange-400"
                          >
                            <FaRedoAlt />
                            Pedir cambios
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {s.estado === "LISTA_PARA_PRODUCCION" && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <FaCheckCircle />
                        Aprobado y listo para producción.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarAlCarrito(s)}
                        disabled={agregandoId === s.id || !s.disenoId}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {agregandoId === s.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaShoppingCart />
                        )}
                        Agregar al carrito
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default SolicitarDiseno;
