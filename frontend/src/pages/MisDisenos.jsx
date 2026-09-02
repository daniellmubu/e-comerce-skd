import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPalette, FaRobot, FaPenNib, FaDownload, FaTrash, FaSpinner, FaExclamationTriangle, FaShareAlt, FaHourglassHalf, FaCheckCircle, FaRegTimesCircle } from "react-icons/fa";

import { listarDisenosPorUsuario, eliminarDiseno, eliminarTodosDisenos, publicarDiseno } from "../services/disenoService";
import { getErrorMessage } from "../services/api";
import { toast } from "sonner";

async function descargarDiseno(diseno) {
  const url = diseno?.imagenUrl;
  if (!url) return;
  const nombre = `diseno-skd-${diseno.id ?? Date.now()}`;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const blob = await respuesta.blob();
    const extension = blob.type.includes("jpeg")
      ? ".jpg"
      : blob.type.includes("webp")
        ? ".webp"
        : ".png";
    const urlBlob = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = urlBlob;
    enlace.download = `${nombre}${extension}`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.warn("Descarga por blob falló; abriendo en nueva pestaña:", error);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.download = `${nombre}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }
}

function MisDisenos() {
  const navigate = useNavigate();
  const [disenos, setDisenos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [borrandoTodos, setBorrandoTodos] = useState(false);
  const [mostrarConfirmBorrarTodos, setMostrarConfirmBorrarTodos] = useState(false);
  const [textoConfirm, setTextoConfirm] = useState("");
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false);
  const [disenoAEliminar, setDisenoAEliminar] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  // Publicación en la galería pública
  const [disenoAPublicar, setDisenoAPublicar] = useState(null);
  const [mostrarPublicar, setMostrarPublicar] = useState(false);
  const [tituloPublicacion, setTituloPublicacion] = useState("");
  const [publicandoId, setPublicandoId] = useState(null);

  useEffect(() => {
    let activo = true;
    listarDisenosPorUsuario()
      .then((lista) => {
        if (activo) setDisenos(Array.isArray(lista) ? lista : []);
      })
      .catch((err) => {
        if (activo) {
          setError(getErrorMessage(err));
          setDisenos([]);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const reintentar = () => {
    setError(null);
    setCargando(true);
    listarDisenosPorUsuario()
      .then((lista) => {
        setDisenos(Array.isArray(lista) ? lista : []);
        setCargando(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setDisenos([]);
        setCargando(false);
      });
  };

  const handleEliminar = async () => {
    if (!disenoAEliminar) return;
    const id = disenoAEliminar.id;
    setEliminandoId(id);
    setMensaje(null);
    try {
      await eliminarDiseno(id);
      setDisenos((prev) => prev.filter((d) => d.id !== id));
      toast.success("Diseño borrado");
      setMostrarConfirmEliminar(false);
      setDisenoAEliminar(null);
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setEliminandoId(null);
    }
  };

  const handleBorrarTodos = async () => {
    if (textoConfirm !== "BORRAR") return;
    setBorrandoTodos(true);
    setMensaje(null);
    try {
      const res = await eliminarTodosDisenos();
      const borrados = res?.borrados ?? disenos.length;
      setDisenos((prev) => {
        // Si el backend salta los usados, recargamos para reflejar los que quedaron.
        // Optimista: vaciamos y luego recargamos si hubo usados.
        if (borrados === prev.length) return [];
        return prev;
      });
      // Recargar para traer los que quedaron por estar usados.
      const lista = await listarDisenosPorUsuario();
      setDisenos(Array.isArray(lista) ? lista : []);
      const restantes = Array.isArray(lista) ? lista.length : 0;
      if (restantes > 0) {
        setMensaje({ tipo: "ok", texto: `Se borraron ${borrados} diseños. ${restantes} no se borraron por estar usados.` });
      } else {
        setMensaje({ tipo: "ok", texto: `Se borraron ${borrados} diseños.` });
      }
      setMostrarConfirmBorrarTodos(false);
      setTextoConfirm("");
      toast.success("Diseños borrados");
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setBorrandoTodos(false);
    }
  };

  const abrirPublicar = (diseno) => {
    setDisenoAPublicar(diseno);
    setTituloPublicacion(diseno.titulo || "");
    setMostrarPublicar(true);
  };

  const handlePublicar = async () => {
    if (!disenoAPublicar) return;
    if (!tituloPublicacion.trim()) {
      setMensaje({ tipo: "error", texto: "Escribe un título para tu diseño." });
      return;
    }
    setPublicandoId(disenoAPublicar.id);
    setMensaje(null);
    try {
      const actualizado = await publicarDiseno({
        id: disenoAPublicar.id,
        titulo: tituloPublicacion.trim(),
      });
      setDisenos((prev) =>
        prev.map((d) => (d.id === actualizado.id ? { ...d, ...actualizado } : d))
      );
      setMensaje({
        tipo: "ok",
        texto: "Diseño enviado a revisión. El equipo lo publicará si cumple las normas.",
      });
      setMostrarPublicar(false);
      setDisenoAPublicar(null);
      setTituloPublicacion("");
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setPublicandoId(null);
    }
  };

  // Etiqueta y estilo del estado de publicación.
  const etiquetaEstadoPublicacion = (estado) => {
    switch (estado) {
      case "PUBLICADO":
        return { texto: "Publicado", icono: <FaCheckCircle />, clase: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" };
      case "PENDIENTE":
        return { texto: "En revisión", icono: <FaHourglassHalf />, clase: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
      case "RECHAZADO":
        return { texto: "Rechazado", icono: <FaRegTimesCircle />, clase: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" };
      case "OCULTO":
        return { texto: "Oculto", icono: <FaRegTimesCircle />, clase: "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300" };
      default:
        return null;
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Tus creaciones
          </span>
          <h1 className="mt-6 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Mis diseños
          </h1>
          <p className="mt-3 text-gray-500 dark:text-slate-400">
            Tus diseños generados con IA o subidos desde el editor.
          </p>
        </div>

        {mensaje && (
          <p
            className={`mb-4 rounded-xl border px-4 py-3 text-center text-sm ${
              mensaje.tipo === "error"
                ? "border-red-300 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        {cargando ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="h-52 bg-gray-200 dark:bg-slate-800" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-300 py-14 text-center dark:border-red-500/30">
            <p className="text-gray-500 dark:text-slate-400">{error}</p>
            <button
              onClick={reintentar}
              className="mt-4 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
            >
              Reintentar
            </button>
          </div>
        ) : disenos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-slate-700">
            <FaPalette className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">Aún no tienes diseños guardados.</p>
            <button
              onClick={() => navigate("/personalizador")}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Crear mi primer diseño
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <FaExclamationTriangle className="mt-0.5 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">Zona de peligro</p>
                    <p className="text-sm text-red-600/80 dark:text-red-300/80">
                      Borra todos tus diseños de una vez. Los que estén usados en pedidos o solicitudes no se borrarán.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarConfirmBorrarTodos(true)}
                  disabled={borrandoTodos}
                  className="shrink-0 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  Borrar todos ({disenos.length})
                </button>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {disenos.map((diseno) => (
              <div
                key={diseno.id}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-800">
                  {diseno.imagenUrl ? (
                    <img
                      src={diseno.imagenUrl}
                      alt={diseno.prompt ?? "Diseño"}
                      className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <FaPalette className="text-3xl text-gray-300 dark:text-slate-600" />
                  )}
                  <span
                    className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      diseno.origen === "USUARIO"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                        : diseno.origen === "CONTACTO_EMPRESA"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    }`}
                  >
                    {diseno.origen === "USUARIO" ? <FaPenNib /> : diseno.origen === "CONTACTO_EMPRESA" ? <FaPalette /> : <FaRobot />}
                    {diseno.origen === "USUARIO" ? "Tu diseño" : diseno.origen === "CONTACTO_EMPRESA" ? "Diseñador" : "IA"}
                  </span>
                  {etiquetaEstadoPublicacion(diseno.estadoPublicacion) && (
                    <span
                      className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${etiquetaEstadoPublicacion(diseno.estadoPublicacion).clase}`}
                    >
                      {etiquetaEstadoPublicacion(diseno.estadoPublicacion).icono}
                      {etiquetaEstadoPublicacion(diseno.estadoPublicacion).texto}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {diseno.producto && (
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {diseno.producto}
                    </p>
                  )}
                  {diseno.prompt && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                      {diseno.prompt}
                    </p>
                  )}
                  {diseno.motivoRechazo && (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      <strong>Motivo:</strong> {diseno.motivoRechazo}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {(!diseno.estadoPublicacion ||
                      diseno.estadoPublicacion === "RECHAZADO" ||
                      diseno.estadoPublicacion === "OCULTO") && (
                      <button
                        type="button"
                        onClick={() => abrirPublicar(diseno)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                      >
                        <FaShareAlt /> Publicar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDisenoAEliminar(diseno);
                        setMostrarConfirmEliminar(true);
                      }}
                      disabled={eliminandoId === diseno.id}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-slate-700 dark:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10"
                    >
                      <FaTrash /> Borrar
                    </button>
                    {diseno.imagenUrl && (
                      <button
                        type="button"
                        onClick={() => descargarDiseno(diseno)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                      >
                        <FaDownload /> Descargar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
            </>
          )}
        </div>

        {mostrarConfirmBorrarTodos && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-lg font-bold text-red-600 dark:text-red-400">
                <FaExclamationTriangle /> ¿Borrar todos?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Esta acción no se puede deshacer. Se borrarán{" "}
                <strong>{disenos.length} diseños</strong>. Los usados en pedidos o
                solicitudes no se borrarán y permanecerán.
              </p>
              <p className="mt-4 text-xs font-semibold text-gray-700 dark:text-slate-300">
                Escribe <strong>BORRAR</strong> para confirmar:
              </p>
              <input
                type="text"
                value={textoConfirm}
                onChange={(e) => setTextoConfirm(e.target.value)}
                placeholder="BORRAR"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarConfirmBorrarTodos(false);
                    setTextoConfirm("");
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBorrarTodos}
                  disabled={textoConfirm !== "BORRAR" || borrandoTodos}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {borrandoTodos ? <FaSpinner className="animate-spin" /> : <FaTrash />}{" "}
                  Borrar todos
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarConfirmEliminar && disenoAEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <FaExclamationTriangle className="text-amber-500" /> ¿Estás seguro de borrar este diseño?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Esta acción no se puede deshacer. Se borrará{" "}
                <strong>{disenoAEliminar.producto || "este diseño"}</strong>.
              </p>
              {disenoAEliminar.imagenUrl && (
                <img
                  src={disenoAEliminar.imagenUrl}
                  alt="Diseño a borrar"
                  className="mt-4 h-32 w-full rounded-xl border border-gray-200 object-contain bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Si el diseño está usado en un pedido o solicitud, no se podrá borrar.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarConfirmEliminar(false);
                    setDisenoAEliminar(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEliminar}
                  disabled={eliminandoId === disenoAEliminar.id}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {eliminandoId === disenoAEliminar.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaTrash />
                  )}{" "}
                  Sí, borrar
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarPublicar && disenoAPublicar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <FaShareAlt className="text-indigo-500 dark:text-cyan-400" /> Publicar en la galería
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                Tu diseño será revisado por el equipo antes de hacerse público.
                Si lo aprueban, todos podrán verlo, darle me gusta y usarlo en sus productos.
              </p>
              {disenoAPublicar.imagenUrl && (
                <img
                  src={disenoAPublicar.imagenUrl}
                  alt="Diseño a publicar"
                  className="mt-4 h-36 w-full rounded-xl border border-gray-200 object-contain bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-800"
                />
              )}
              <label className="mt-4 block text-xs font-semibold text-gray-700 dark:text-slate-300">
                Título del diseño
              </label>
              <input
                type="text"
                value={tituloPublicacion}
                onChange={(e) => setTituloPublicacion(e.target.value)}
                maxLength={120}
                placeholder="Ej: Mascota en caricatura"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {disenoAPublicar.motivoRechazo && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  Motivo anterior: {disenoAPublicar.motivoRechazo}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarPublicar(false);
                    setDisenoAPublicar(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePublicar}
                  disabled={publicandoId === disenoAPublicar.id}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {publicandoId === disenoAPublicar.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaShareAlt />
                  )}{" "}
                  Publicar
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
  );
}

export default MisDisenos;
