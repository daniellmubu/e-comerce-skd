import { useCallback, useEffect, useState } from "react";
import {
  FaEye,
  FaClipboardList,
  FaSave,
  FaSearch,
  FaPalette,
  FaImage,
  FaCheck,
} from "react-icons/fa";

import Badge from "../components/Badge";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import Input from "../components/Input";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import Select from "../components/Select";
import { getErrorMessage } from "../api/axios";
import {
  listarPedidos,
  obtenerPedidoPorId,
  cambiarEstadoPedido,
  aprobarPago,
} from "../api/pedidosApi";
import { formatPrice, formatFechaHora, capitalizar } from "../utils/formato";

// Estados coherentes con el backend (AdminPedidoServiceImpl.ESTADOS_VALIDOS)
const ESTADOS = ["recibido", "disenando", "enviado", "entregado", "cancelado"];

const ESTADO_VARIANT = {
  recibido: "cyan",
  disenando: "violet",
  enviado: "amber",
  entregado: "green",
  cancelado: "red",
};

function Pedidos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [usuarioIdFiltro, setUsuarioIdFiltro] = useState("");
  const [filtrosAplicados, setFiltrosAplicados] = useState({ estado: "", usuarioId: "" });

  // Detalle del pedido
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [aprobandoPago, setAprobandoPago] = useState(false);
  const [detalleError, setDetalleError] = useState(null);
  // URL del diseño a ampliar en la vista previa
  const [imagenEnVista, setImagenEnVista] = useState(null);

  const cargar = useCallback(
    async (pagina = page, tamanio = size, filtros = filtrosAplicados) => {
      setLoading(true);
      setError(null);
      try {
        const resultado = await listarPedidos({
          page: pagina,
          size: tamanio,
          estado: filtros.estado || undefined,
          usuarioId: filtros.usuarioId || undefined,
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
    setFiltrosAplicados({
      estado: estadoFiltro,
      usuarioId: usuarioIdFiltro.trim(),
    });
    setPage(0);
  };

  const limpiarFiltros = () => {
    setEstadoFiltro("");
    setUsuarioIdFiltro("");
    setFiltrosAplicados({ estado: "", usuarioId: "" });
    setPage(0);
  };

  const abrirDetalle = async (pedido) => {
    setDetalle(pedido);
    setNuevoEstado(pedido.estado);
    setDetalleError(null);
    setDetalleLoading(true);
    try {
      const completo = await obtenerPedidoPorId(pedido.id);
      setDetalle(completo);
      setNuevoEstado(completo.estado);
    } catch (err) {
      setDetalleError(getErrorMessage(err));
    } finally {
      setDetalleLoading(false);
    }
  };

  const guardarEstado = async () => {
    if (!detalle || !nuevoEstado || nuevoEstado === detalle.estado) {
      setDetalle(null);
      return;
    }
    setGuardandoEstado(true);
    setDetalleError(null);
    try {
      const actualizado = await cambiarEstadoPedido(detalle.id, nuevoEstado);
      setDetalle(actualizado);
      setNuevoEstado(actualizado.estado);
      cargar();
    } catch (err) {
      setDetalleError(getErrorMessage(err));
    } finally {
      setGuardandoEstado(false);
    }
  };

  const aprobarPagoPedido = async () => {
    if (!detalle) return;
    setAprobandoPago(true);
    setDetalleError(null);
    try {
      const actualizado = await aprobarPago(detalle.id);
      setDetalle(actualizado);
      setNuevoEstado(actualizado.estado);
      cargar();
    } catch (err) {
      setDetalleError(getErrorMessage(err));
    } finally {
      setAprobandoPago(false);
    }
  };

  const pedidos = data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Gestiona los pedidos y su estado.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Estado"
          placeholder="Todos los estados"
          options={ESTADOS.map((e) => ({ value: e, label: capitalizar(e) }))}
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        />
        <Input
          label="ID de usuario"
          type="number"
          placeholder="Ej. 7"
          value={usuarioIdFiltro}
          onChange={(e) => setUsuarioIdFiltro(e.target.value)}
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
          <Loading label="Cargando pedidos..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => cargar()}>
            Reintentar
          </Button>
        </div>
      ) : pedidos.length === 0 ? (
        <EmptyState
          icon={<FaClipboardList />}
          title="No hay pedidos"
          description="Prueba con otros filtros."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="hidden px-6 py-4 md:table-cell">Fecha</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      #{pedido.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {pedido.usuario}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-500 dark:text-slate-400 md:table-cell">
                      {formatFechaHora(pedido.creadoEn)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={ESTADO_VARIANT[pedido.estado] || "slate"}>
                        {capitalizar(pedido.estado)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {formatPrice(pedido.total)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirDetalle(pedido)}
                          leftIcon={<FaEye />}
                        >
                          Ver detalle
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
        title={detalle ? `Pedido #${detalle.id}` : "Pedido"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setDetalle(null)}>
              Cerrar
            </Button>
          </>
        }
      >
        {detalleLoading ? (
          <div className="flex justify-center py-12">
            <Loading label="Cargando detalle..." />
          </div>
        ) : detalleError ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {detalleError}
          </p>
        ) : detalle ? (
          <div className="space-y-6">
            {/* Resumen del pedido */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Cliente
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {detalle.usuario}{" "}
                  <span className="text-sm font-normal text-gray-500 dark:text-slate-400">
                    (id {detalle.usuarioId})
                  </span>
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {formatFechaHora(detalle.creadoEn)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  Estado actual
                </p>
                <Badge
                  variant={ESTADO_VARIANT[detalle.estado] || "slate"}
                  className="mt-1"
                >
                  {capitalizar(detalle.estado)}
                </Badge>
              </div>
            </div>

            {/* Empaque y regalo */}
            {(detalle.empaque || detalle.destinatarioRegalo) && (
              <div>
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                  Empaque y entrega
                </h3>
                <div className="rounded-xl border border-gray-200 p-4 text-sm dark:border-slate-700">
                  {detalle.empaque && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 dark:text-slate-400">Empaque</span>
                      <span className="font-semibold capitalize text-gray-900 dark:text-white">
                        {detalle.empaque}
                      </span>
                    </div>
                  )}
                  {detalle.destinatarioRegalo && (
                    <>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-gray-500 dark:text-slate-400">Regalo para</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {detalle.destinatarioRegalo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-gray-500 dark:text-slate-400">Ocasión</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {detalle.ocasionRegalo}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                Productos ({detalle.items?.length ?? 0})
              </h3>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-slate-800 dark:border-slate-700">
                {detalle.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {item.imagenDisenoUrl ? (
                      <button
                        type="button"
                        onClick={() => setImagenEnVista(item.imagenDisenoUrl)}
                        title="Ver diseño"
                        className="shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:opacity-80 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <img
                          src={item.imagenDisenoUrl}
                          alt={`Diseño de ${item.producto}`}
                          className="h-14 w-14 object-contain"
                        />
                      </button>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-300 dark:border-slate-700 dark:text-slate-600">
                        <FaImage />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {item.producto}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {item.cantidad} × {formatPrice(item.precioUnitario)}
                      </p>
                      {item.imagenDisenoUrl && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                          <FaPalette /> Diseño personalizado
                        </p>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
                {(!detalle.items || detalle.items.length === 0) && (
                  <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-slate-400">
                    Sin productos.
                  </p>
                )}
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(detalle.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Envío</span>
                <span>{formatPrice(detalle.costoEnvio)}</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-slate-400">
                <span>Descuento</span>
                <span>-{formatPrice(detalle.descuento)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900 dark:border-slate-800 dark:text-white">
                <span>Total</span>
                <span>{formatPrice(detalle.total)}</span>
              </div>
            </div>

            {detalle.metodoPago && detalle.estadoPago !== "aprobado" && (
              <div className="rounded-xl border border-emerald-200 p-4 dark:border-emerald-500/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Pago
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Método: {capitalizar(detalle.metodoPago)} · Estado:{" "}
                      {capitalizar(detalle.estadoPago)}
                    </p>
                  </div>
                  <Button
                    onClick={aprobarPagoPedido}
                    loading={aprobandoPago}
                    leftIcon={<FaCheck />}
                    className="!bg-emerald-600"
                  >
                    Aprobar pago
                  </Button>
                </div>
              </div>
            )}

            {/* Cambiar estado */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
              <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                Cambiar estado
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Select
                  label="Nuevo estado"
                  options={ESTADOS.map((e) => ({
                    value: e,
                    label: capitalizar(e),
                  }))}
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                />
                <Button
                  onClick={guardarEstado}
                  loading={guardandoEstado}
                  disabled={nuevoEstado === detalle.estado}
                  leftIcon={<FaSave />}
                >
                  Guardar estado
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">
                El cambio de estado notifica al cliente en tiempo real vía
                WebSocket.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal vista previa de diseño */}
      <Modal
        isOpen={!!imagenEnVista}
        onClose={() => setImagenEnVista(null)}
        title="Diseño del pedido"
        size="xl"
        footer={
          <Button variant="outline" onClick={() => setImagenEnVista(null)}>
            Cerrar
          </Button>
        }
      >
        {imagenEnVista && (
          <div className="flex justify-center">
            <img
              src={imagenEnVista}
              alt="Diseño del pedido"
              className="max-h-[70vh] w-auto rounded-xl border border-gray-200 bg-white object-contain dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Pedidos;
