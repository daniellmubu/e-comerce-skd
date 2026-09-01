import { useCallback, useEffect, useState } from "react";
import {
  FaCheck,
  FaTimes,
  FaEyeSlash,
  FaTrash,
  FaHeart,
  FaFire,
  FaSearch,
  FaPalette,
  FaHourglassHalf,
  FaImage,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import Input from "../components/Input";
import { getErrorMessage } from "../api/axios";
import {
  listarDisenos,
  obtenerResumenDisenos,
  topDisenosMeGusta,
  topDisenosUsos,
  aprobarDiseno,
  rechazarDiseno,
  ocultarDiseno,
  eliminarDiseno,
} from "../api/disenosApi";
import { formatFechaHora, capitalizar } from "../utils/formato";

const ESTADOS = ["pendiente", "publicado", "rechazado", "oculto"];

const ESTADO_VARIANT = {
  pendiente: "amber",
  publicado: "green",
  rechazado: "red",
  oculto: "slate",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente",
  publicado: "Publicado",
  rechazado: "Rechazado",
  oculto: "Oculto",
};

const TARJETAS_RESUMEN = [
  { clave: "pendiente", label: "Pendientes", variant: "amber", icon: <FaHourglassHalf /> },
  { clave: "publicado", label: "Publicados", variant: "green", icon: <FaCheck /> },
  { clave: "rechazado", label: "Rechazados", variant: "red", icon: <FaTimes /> },
  { clave: "oculto", label: "Ocultos", variant: "slate", icon: <FaEyeSlash /> },
];

function MiniDiseno({ d, ranking }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-cyan-500/20 dark:text-cyan-300">
        {ranking}
      </span>
      {d.imagenUrl ? (
        <img src={d.imagenUrl} alt={d.titulo || "Diseño"} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-slate-800">
          <FaImage />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {d.titulo || "Diseño sin título"}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          por {d.usuarioNombre || "Anónimo"}
        </p>
      </div>
      <span className="shrink-0 text-sm font-bold text-gray-700 dark:text-slate-200">
        {ranking === "meGusta" ? <span className="inline-flex items-center gap-1 text-red-500"><FaHeart /> {d.meGusta}</span> : <span className="inline-flex items-center gap-1 text-orange-500"><FaFire /> {d.vecesUsado}</span>}
      </span>
    </div>
  );
}

function Disenos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [estadoFiltro, setEstadoFiltro] = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    estado: "pendiente",
    busqueda: "",
  });

  const [resumen, setResumen] = useState(null);
  const [topMeGusta, setTopMeGusta] = useState([]);
  const [topUsos, setTopUsos] = useState([]);

  const [detalle, setDetalle] = useState(null);

  // Modal de rechazar / ocultar
  const [moderar, setModerar] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [moderando, setModerando] = useState(false);

  // Modal de eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  const [accionId, setAccionId] = useState(null);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtros = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarDisenos({
          page: pagina,
          size: tamanio,
          estado: filtros.estado || undefined,
          busqueda: filtros.busqueda || undefined,
        });
        setData(resultado);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [page, size, filtrosAplicados]
  );

  useEffect(() => {
    cargar(page, size);
  }, [cargar, page, size]);

  const refrescarResumen = useCallback(() => {
    obtenerResumenDisenos().then(setResumen).catch(() => {});
    topDisenosMeGusta(5).then((r) => setTopMeGusta(Array.isArray(r) ? r : [])).catch(() => {});
    topDisenosUsos(5).then((r) => setTopUsos(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  useEffect(() => {
    refrescarResumen();
  }, [refrescarResumen]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({ estado: estadoFiltro, busqueda });
    setPage(0);
  };

  const limpiarFiltros = () => {
    setEstadoFiltro("");
    setBusqueda("");
    setFiltrosAplicados({ estado: "", busqueda: "" });
    setPage(0);
  };

  const manejarAprobar = async (diseno) => {
    setAccionId(diseno.id);
    try {
      const actualizada = await aprobarDiseno(diseno.id);
      if (detalle?.id === diseno.id) setDetalle(actualizada);
      cargar();
      refrescarResumen();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionId(null);
    }
  };

  const abrirModerar = (diseno, accion) => {
    setModerar({ diseno, accion });
    setMotivo("");
  };

  const confirmarModerar = async () => {
    if (!moderar) return;
    if (!motivo.trim()) return;
    setModerando(true);
    try {
      if (moderar.accion === "rechazar") {
        await rechazarDiseno(moderar.diseno.id, motivo.trim());
      } else {
        await ocultarDiseno(moderar.diseno.id, motivo.trim());
      }
      if (detalle?.id === moderar.diseno.id) setDetalle(null);
      setModerar(null);
      setMotivo("");
      cargar();
      refrescarResumen();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setModerando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarDiseno(eliminando.id);
      if (detalle?.id === eliminando.id) setDetalle(null);
      setEliminando(null);
      cargar();
      refrescarResumen();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const disenos = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Diseños de la comunidad
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Aprueba, rechaza u oculta los diseños que los usuarios publican. Mira
          cuáles son los que más le gustan y más se usan.
        </p>
      </div>

      {/* Resumen por estado */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TARJETAS_RESUMEN.map((t) => (
          <div
            key={t.clave}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
                {t.label}
              </p>
              <Badge variant={t.variant}>{t.icon}</Badge>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {resumen?.[t.clave] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Rankings de popularidad */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <FaHeart className="text-red-500" /> Top diseños con más me gusta
          </h2>
          {topMeGusta.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Sin datos todavía.</p>
          ) : (
            <div className="space-y-2">
              {topMeGusta.map((d, i) => (
                <MiniDiseno key={d.id} d={d} ranking={i + 1} />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <FaFire className="text-orange-500" /> Top diseños más usados
          </h2>
          {topUsos.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Sin datos todavía.</p>
          ) : (
            <div className="space-y-2">
              {topUsos.map((d, i) => (
                <MiniDiseno key={d.id} d={d} ranking={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Estado"
          placeholder="Todos los estados"
          options={ESTADOS.map((e) => ({
            value: e,
            label: ESTADO_LABEL[e] || capitalizar(e),
          }))}
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        />
        <Input
          label="Buscar por título"
          placeholder="Nombre del diseño..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
        />
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={aplicarFiltros} leftIcon={<FaSearch />}>
            Buscar
          </Button>
          <Button variant="outline" onClick={limpiarFiltros}>
            Limpiar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando diseños..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : disenos.length === 0 ? (
        <EmptyState
          icon={<FaPalette />}
          title="No hay diseños"
          description="Prueba con otros filtros."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Diseño</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="hidden px-6 py-4 md:table-cell">Producto</th>
                  <th className="px-6 py-4">Me gusta</th>
                  <th className="px-6 py-4">Usos</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {disenos.map((diseno) => (
                  <tr
                    key={diseno.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{diseno.id}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setDetalle(diseno)}
                        className="flex items-center gap-3 text-left"
                      >
                        {diseno.imagenUrl ? (
                          <img
                            src={diseno.imagenUrl}
                            alt={diseno.titulo || "Diseño"}
                            className="h-12 w-12 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-slate-800">
                            <FaImage />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block max-w-[200px] truncate font-semibold text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-cyan-300">
                            {diseno.titulo || "Diseño sin título"}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-slate-400">
                            {formatFechaHora(diseno.createdAt)}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {diseno.usuarioNombre || "—"}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <p className="max-w-[160px] truncate text-gray-600 dark:text-slate-300">
                        {diseno.producto || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-red-500">
                        <FaHeart /> {diseno.meGusta}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-orange-500">
                        <FaFire /> {diseno.vecesUsado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={ESTADO_VARIANT[diseno.estadoPublicacion] || "slate"}>
                        {ESTADO_LABEL[diseno.estadoPublicacion] || "No publicado"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {diseno.estadoPublicacion === "pendiente" && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<FaCheck />}
                            disabled={accionId === diseno.id}
                            onClick={() => manejarAprobar(diseno)}
                          >
                            Aprobar
                          </Button>
                        )}
                        {(diseno.estadoPublicacion === "pendiente" ||
                          diseno.estadoPublicacion === "publicado") && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<FaTimes />}
                            onClick={() => abrirModerar(diseno, "rechazar")}
                          >
                            Rechazar
                          </Button>
                        )}
                        {diseno.estadoPublicacion === "publicado" && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<FaEyeSlash />}
                            onClick={() => abrirModerar(diseno, "ocultar")}
                          >
                            Ocultar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          leftIcon={<FaTrash />}
                          onClick={() => setEliminando(diseno)}
                        >
                          Borrar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-4 py-3 dark:border-slate-800">
            <Pagination
              page={data?.number ?? 0}
              totalPages={data?.totalPages ?? 0}
              totalElements={data?.totalElements ?? 0}
              pageSize={data?.size ?? size}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setSize(s);
                setPage(0);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal detalle */}
      <Modal
        isOpen={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle?.titulo || "Detalle del diseño"}
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            {detalle?.estadoPublicacion === "pendiente" && (
              <Button
                variant="primary"
                leftIcon={<FaCheck />}
                disabled={accionId === detalle?.id}
                onClick={() => manejarAprobar(detalle)}
              >
                Aprobar
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </div>
        }
      >
        {detalle && (
          <div className="space-y-4">
            <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-800">
              {detalle.imagenUrl ? (
                <img
                  src={detalle.imagenUrl}
                  alt={detalle.titulo || "Diseño"}
                  className="max-h-72 rounded-lg object-contain"
                />
              ) : (
                <FaPalette className="m-8 text-4xl text-gray-300 dark:text-slate-600" />
              )}
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Usuario:</strong> {detalle.usuarioNombre || "—"}
              </p>
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Producto:</strong> {detalle.producto || "—"}
              </p>
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Me gusta:</strong> {detalle.meGusta}
              </p>
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Usos:</strong> {detalle.vecesUsado}
              </p>
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Origen:</strong> {detalle.origen || "—"}
              </p>
              <p className="text-gray-600 dark:text-slate-300">
                <strong>Estado:</strong> {ESTADO_LABEL[detalle.estadoPublicacion] || "No publicado"}
              </p>
            </div>
            {detalle.prompt && (
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                <strong>Prompt:</strong> {detalle.prompt}
              </p>
            )}
            {detalle.motivoRechazo && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                <strong>Motivo:</strong> {detalle.motivoRechazo}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal rechazar / ocultar */}
      <Modal
        isOpen={!!moderar}
        onClose={() => setModerar(null)}
        title={
          moderar?.accion === "ocultar"
            ? "Ocultar diseño"
            : "Rechazar diseño"
        }
      >
        <p className="text-sm text-gray-600 dark:text-slate-300">
          {moderar?.accion === "ocultar"
            ? "El diseño dejará de ser visible en la galería pública. Indica el motivo:"
            : "El diseño no se publicará y su dueño verá el motivo. Indica por qué:"}
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Ej: Contenido inapropiado, baja calidad..."
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-cyan-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModerar(null)}>
            Cancelar
          </Button>
          <Button
            variant={moderar?.accion === "ocultar" ? "primary" : "danger"}
            leftIcon={moderar?.accion === "ocultar" ? <FaEyeSlash /> : <FaTimes />}
            disabled={!motivo.trim() || moderando}
            onClick={confirmarModerar}
          >
            {moderando ? "Guardando..." : moderar?.accion === "ocultar" ? "Ocultar" : "Rechazar"}
          </Button>
        </div>
      </Modal>

      {/* Modal eliminar */}
      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar diseño"
      >
        <p className="text-sm text-gray-600 dark:text-slate-300">
          ¿Seguro que quieres eliminar el diseño{" "}
          <strong>{eliminando?.titulo || "sin título"}</strong>? Si está usado en
          pedidos, no se podrá borrar y deberás ocultarlo.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEliminando(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            leftIcon={<FaTrash />}
            disabled={eliminandoLoading}
            onClick={confirmarEliminar}
          >
            {eliminandoLoading ? "Borrando..." : "Sí, borrar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Disenos;
