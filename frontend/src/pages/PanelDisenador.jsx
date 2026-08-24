import { useEffect, useRef, useState } from "react";
import {
  FaPenNib,
  FaSpinner,
  FaCheckCircle,
  FaPaperPlane,
  FaUpload,
  FaTimes,
  FaInbox,
  FaUser,
  FaBox,
  FaRedoAlt,
  FaLock,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import {
  listarSolicitudes,
  tomarSolicitud,
  enviarPropuesta,
} from "../services/adminSolicitudDisenoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

const ESTADOS = {
  RECIBIDA: {
    label: "Recibida",
    classes: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  },
  EN_DISENO: {
    label: "En diseño",
    classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  PROPUESTA_ENVIADA: {
    label: "Propuesta enviada",
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  },
  CAMBIOS_SOLICITADOS: {
    label: "Cambios solicitados",
    classes: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  LISTA_PARA_PRODUCCION: {
    label: "Lista para producción",
    classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
};

const FILTROS = [
  { value: "", label: "Todas" },
  { value: "RECIBIDA", label: "Recibidas" },
  { value: "EN_DISENO", label: "En diseño" },
  { value: "CAMBIOS_SOLICITADOS", label: "Con cambios" },
  { value: "PROPUESTA_ENVIADA", label: "Propuestas enviadas" },
  { value: "LISTA_PARA_PRODUCCION", label: "Listas" },
];

function PanelDisenador() {
  const { usuario } = useAuth();
  const esDisenador = usuario?.rol === "admin" || usuario?.rol === "disenador";

  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [accionandoId, setAccionandoId] = useState(null);
  const [propuestaAbiertaId, setPropuestaAbiertaId] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [mensajeAdmin, setMensajeAdmin] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!esDisenador) return undefined;

    let activo = true;

    listarSolicitudes(estadoFiltro || null)
      .then((data) => {
        if (!activo) return;
        const lista = Array.isArray(data) ? data : data?.content ?? [];
        setSolicitudes(lista);
        setCargando(false);
        setError(null);
      })
      .catch((err) => {
        if (!activo) return;
        setError(getErrorMessage(err));
        setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [estadoFiltro, esDisenador]);

  const recargar = () => {
    listarSolicitudes(estadoFiltro || null)
      .then((data) => {
        const lista = Array.isArray(data) ? data : data?.content ?? [];
        setSolicitudes(lista);
        setError(null);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  const handleFiltro = (valor) => {
    setEstadoFiltro(valor);
    setCargando(true);
  };

  const handleTomar = async (id) => {
    setAccionandoId(id);
    setMensaje(null);
    try {
      await tomarSolicitud(id);
      setMensaje({ tipo: "ok", texto: "Solicitud tomada. Ya puedes enviar la propuesta." });
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setAccionandoId(null);
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

  const abrirPropuesta = (id) => {
    setPropuestaAbiertaId(id);
    setArchivo(null);
    setArchivoPreview(null);
    setMensajeAdmin("");
    setMensaje(null);
  };

  const handleEnviarPropuesta = async (id) => {
    if (!archivo) {
      setMensaje({ tipo: "error", texto: "Sube la imagen de la propuesta." });
      return;
    }
    setAccionandoId(id);
    setMensaje(null);
    try {
      await enviarPropuesta(id, { file: archivo, mensajeAdmin });
      setPropuestaAbiertaId(null);
      setArchivo(null);
      setArchivoPreview(null);
      setMensajeAdmin("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMensaje({ tipo: "ok", texto: "Propuesta enviada al cliente." });
      recargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setAccionandoId(null);
    }
  };

  if (!esDisenador) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-gray-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900/80">
          <FaLock className="mx-auto mb-4 text-3xl text-gray-400 dark:text-slate-500" />
          <h1 className="text-2xl font-bold">Sin acceso</h1>
          <p className="mt-2 text-gray-500 dark:text-slate-400">
            Esta sección es solo para diseñadores y administradores.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Panel del diseñador
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">
            Solicitudes de diseño
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-500 dark:text-slate-400">
            Toma las solicitudes de los clientes, prepara una propuesta y
            envíala para que la aprueben.
          </p>
        </div>

        {/* Filtros por estado */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFiltro(f.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                estadoFiltro === f.value
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                  : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {mensaje && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-center text-sm ${
              mensaje.tipo === "error"
                ? "border border-red-300 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                : "border border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {cargando && (
          <div className="flex justify-center py-16">
            <Loading label="Cargando solicitudes..." />
          </div>
        )}

        {!cargando && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={recargar}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!cargando && !error && solicitudes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaInbox className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>No hay solicitudes en este estado.</p>
          </div>
        )}

        {!cargando && !error && solicitudes.length > 0 && (
          <div className="space-y-5">
            {solicitudes.map((s) => {
              const estado = ESTADOS[s.estado] ?? {
                label: s.estado,
                classes: "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
              };

              return (
                <div
                  key={s.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur"
                >
                  <div className="flex flex-col gap-5 p-6 lg:flex-row">
                    {/* Info de la solicitud */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.classes}`}>
                          {estado.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                          <FaBox className="text-xs" /> {s.producto}
                        </span>
                      </div>

                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                        <FaUser className="text-xs text-gray-400" /> {s.usuario}
                      </p>

                      <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
                        {s.descripcion}
                      </p>

                      {s.motivoCambios && (
                        <p className="mt-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
                          <strong>Pide cambios:</strong> {s.motivoCambios}
                        </p>
                      )}
                    </div>

                    {/* Imágenes */}
                    <div className="flex shrink-0 gap-3">
                      {s.referenciaImagenUrl && (
                        <figure className="text-center">
                          <img
                            src={s.referenciaImagenUrl}
                            alt="Referencia del cliente"
                            className="h-32 w-32 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                          />
                          <figcaption className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                            Referencia
                          </figcaption>
                        </figure>
                      )}
                      {s.propuestaImagenUrl && (
                        <figure className="text-center">
                          <img
                            src={s.propuestaImagenUrl}
                            alt="Propuesta enviada"
                            className="h-32 w-32 rounded-xl border border-gray-200 object-contain bg-gray-50 dark:border-slate-700 dark:bg-slate-800"
                          />
                          <figcaption className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                            Propuesta
                          </figcaption>
                        </figure>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  {(s.estado === "RECIBIDA" ||
                    s.estado === "CAMBIOS_SOLICITADOS" ||
                    s.estado === "EN_DISENO") && (
                    <div className="border-t border-gray-200 p-5 dark:border-slate-800">
                      {s.estado === "EN_DISENO" ? (
                        propuestaAbiertaId === s.id ? (
                          <div className="space-y-3">
                            {archivoPreview ? (
                              <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-3 dark:border-slate-700">
                                <img
                                  src={archivoPreview}
                                  alt="Propuesta"
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
                                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-5 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                              >
                                <FaUpload />
                                Sube la imagen de la propuesta
                              </button>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleSeleccionarArchivo}
                              className="hidden"
                            />

                            <textarea
                              value={mensajeAdmin}
                              onChange={(e) => setMensajeAdmin(e.target.value)}
                              rows={2}
                              placeholder="Mensaje para el cliente (opcional)"
                              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />

                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => handleEnviarPropuesta(s.id)}
                                disabled={accionandoId === s.id}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                              >
                                {accionandoId === s.id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <FaPaperPlane />
                                )}
                                Enviar propuesta
                              </button>
                              <button
                                type="button"
                                onClick={() => setPropuestaAbiertaId(null)}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 dark:border-slate-700 dark:text-slate-300"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => abrirPropuesta(s.id)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                          >
                            <FaPenNib />
                            Enviar propuesta
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTomar(s.id)}
                          disabled={accionandoId === s.id}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                        >
                          {accionandoId === s.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaRedoAlt />
                          )}
                          {s.estado === "CAMBIOS_SOLICITADOS"
                            ? "Tomar y rediseñar"
                            : "Tomar solicitud"}
                        </button>
                      )}
                    </div>
                  )}

                  {s.estado === "PROPUESTA_ENVIADA" && (
                    <div className="flex items-center gap-2 border-t border-gray-200 p-5 text-sm text-amber-600 dark:border-slate-800 dark:text-amber-400">
                      <FaCheckCircle />
                      Propuesta enviada. Esperando la respuesta del cliente.
                    </div>
                  )}

                  {s.estado === "LISTA_PARA_PRODUCCION" && (
                    <div className="flex items-center gap-2 border-t border-gray-200 p-5 text-sm font-medium text-emerald-600 dark:border-slate-800 dark:text-emerald-400">
                      <FaCheckCircle />
                      Aprobada y lista para producción.
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

export default PanelDisenador;
