import { useCallback, useEffect, useState } from "react";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaTrash,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaImage,
  FaSearch,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import { getErrorMessage } from "../api/axios";
import {
  listarResenas,
  aprobarResena,
  rechazarResena,
  eliminarResena,
} from "../api/resenasApi";
import { formatFechaHora } from "../utils/formato";

const ESTADOS = ["pendiente", "aprobada", "rechazada"];

const ESTADO_VARIANT = {
  pendiente: "amber",
  aprobada: "green",
  rechazada: "red",
};

function Estrellas({ calificacion }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((n) => {
        const value = calificacion ?? 0;
        if (value >= n) return <FaStar key={n} />;
        if (value >= n - 0.5) return <FaStarHalfAlt key={n} />;
        return <FaRegStar key={n} className="text-gray-300 dark:text-slate-600" />;
      })}
    </span>
  );
}

function Resenas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [estadoFiltro, setEstadoFiltro] = useState("pendiente");
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    estado: "pendiente",
  });

  // Detalle de la reseña
  const [detalle, setDetalle] = useState(null);

  // Modal eliminar
  const [eliminando, setEliminando] = useState(null);
  const [eliminandoLoading, setEliminandoLoading] = useState(false);

  const [accionId, setAccionId] = useState(null);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtros = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarResenas({
          page: pagina,
          size: tamanio,
          estado: filtros.estado || undefined,
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

  const aplicarFiltros = () => {
    setFiltrosAplicados({ estado: estadoFiltro });
    setPage(0);
  };

  const limpiarFiltros = () => {
    setEstadoFiltro("");
    setFiltrosAplicados({ estado: "" });
    setPage(0);
  };

  const manejarAprobar = async (resena) => {
    setAccionId(resena.id);
    try {
      const actualizada = await aprobarResena(resena.id);
      if (detalle?.id === resena.id) setDetalle(actualizada);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionId(null);
    }
  };

  const manejarRechazar = async (resena) => {
    setAccionId(resena.id);
    try {
      const actualizada = await rechazarResena(resena.id);
      if (detalle?.id === resena.id) setDetalle(actualizada);
      cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionId(null);
    }
  };

  const confirmarEliminar = async () => {
    if (!eliminando) return;
    setEliminandoLoading(true);
    try {
      await eliminarResena(eliminando.id);
      setEliminando(null);
      if (detalle?.id === eliminando.id) setDetalle(null);
      cargar();
    } catch (err) {
      setEliminando(null);
      setError(getErrorMessage(err));
    } finally {
      setEliminandoLoading(false);
    }
  };

  const resenas = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Moderación de reseñas
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Aprueba o rechaza las reseñas con foto antes de que sean públicas.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Estado"
          placeholder="Todos los estados"
          options={ESTADOS.map((e) => ({
            value: e,
            label: e.charAt(0).toUpperCase() + e.slice(1),
          }))}
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
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

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando reseñas..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : resenas.length === 0 ? (
        <EmptyState
          icon={<FaStarHalfAlt />}
          title="No hay reseñas"
          description="Prueba con otros filtros."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Producto</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Calificación</th>
                  <th className="hidden px-6 py-4 md:table-cell">Comentario</th>
                  <th className="hidden px-6 py-4 lg:table-cell">Foto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {resenas.map((resena) => (
                  <tr
                    key={resena.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{resena.id}
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-[200px] truncate font-semibold text-gray-900 dark:text-white">
                        {resena.productoNombre || "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {formatFechaHora(resena.creadoEn)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {resena.usuarioNombre || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Estrellas calificacion={resena.calificacion} />
                    </td>
                    <td className="hidden max-w-[260px] px-6 py-4 md:table-cell">
                      <p className="truncate text-gray-600 dark:text-slate-300">
                        {resena.comentario || "—"}
                      </p>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      {resena.imagenUrl ? (
                        <button
                          type="button"
                          onClick={() => setDetalle(resena)}
                          className="overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:opacity-80 dark:border-slate-700 dark:bg-slate-800"
                        >
                          <img
                            src={resena.imagenUrl}
                            alt="Foto de la reseña"
                            className="h-12 w-12 object-cover"
                          />
                        </button>
                      ) : (
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-300 dark:border-slate-700 dark:text-slate-600">
                          <FaImage />
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={ESTADO_VARIANT[resena.estado] || "slate"}>
                        {resena.estado
                          ? resena.estado.charAt(0).toUpperCase() +
                            resena.estado.slice(1)
                          : "—"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetalle(resena)}
                          leftIcon={<FaEye />}
                        >
                          Ver
                        </Button>
                        {resena.estado !== "aprobada" && (
                          <Button
                            variant="success"
                            size="sm"
                            loading={accionId === resena.id}
                            onClick={() => manejarAprobar(resena)}
                            leftIcon={<FaCheck />}
                          >
                            Aprobar
                          </Button>
                        )}
                        {resena.estado !== "rechazada" && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={accionId === resena.id}
                            onClick={() => manejarRechazar(resena)}
                            leftIcon={<FaTimes />}
                          >
                            Rechazar
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setEliminando(resena)}
                          leftIcon={<FaTrash />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 dark:border-slate-800">
            <Pagination
              page={data.number}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              pageSize={data.size}
              onPageChange={setPage}
              onPageSizeChange={(nuevoSize) => {
                setSize(nuevoSize);
                setPage(0);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      <Modal
        isOpen={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle ? `Reseña #${detalle.id}` : "Reseña"}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {detalle && (
          <div className="space-y-4">
            {detalle.imagenUrl ? (
              <img
                src={detalle.imagenUrl}
                alt="Foto de la reseña"
                className="max-h-72 w-full rounded-xl border border-gray-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-800"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300 dark:border-slate-700 dark:text-slate-600">
                <FaImage className="h-8 w-8" />
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Producto
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {detalle.productoNombre || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Usuario
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {detalle.usuarioNombre || "—"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Estrellas calificacion={detalle.calificacion} />
              <Badge variant={ESTADO_VARIANT[detalle.estado] || "slate"}>
                {detalle.estado}
              </Badge>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                Comentario
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-700 dark:text-slate-200">
                {detalle.comentario || "Sin comentario."}
              </p>
            </div>

            <p className="text-xs text-gray-400 dark:text-slate-500">
              Creada el {formatFechaHora(detalle.creadoEn)}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal
        isOpen={!!eliminando}
        onClose={() => setEliminando(null)}
        title="Eliminar reseña"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEliminando(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={eliminandoLoading}
              onClick={confirmarEliminar}
              leftIcon={<FaTrash />}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que deseas eliminar la reseña{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            #{eliminando?.id}
          </span>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}

export default Resenas;
