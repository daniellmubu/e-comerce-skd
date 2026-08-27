import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaIndustry,
  FaPalette,
  FaBox,
  FaUndo,
  FaCheckCircle,
  FaGripVertical,
} from "react-icons/fa";

import Button from "../components/Button";
import Loading from "../components/Loading";
import { getErrorMessage } from "../api/axios";
import { obtenerKanban, cambiarEstadoPedido } from "../api/pedidosApi";
import { formatPrice, formatFechaHora } from "../utils/formato";

// Estados del tablero de producción (coherentes con el backend).
const COLUMNAS = [
  { estado: "recibido", titulo: "Recibido", color: "cyan" },
  { estado: "disenando", titulo: "Diseñando", color: "violet" },
  { estado: "imprimiendo", titulo: "Imprimiendo", color: "purple" },
  { estado: "empacando", titulo: "Empacando", color: "amber" },
  { estado: "enviado", titulo: "Enviado", color: "green" },
];

const COLOR_HEADER = {
  cyan: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  violet: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  purple: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  amber: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  green: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

function Produccion() {
  const [tablero, setTablero] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const [arrastrando, setArrastrando] = useState(null);
  const [sobreEstado, setSobreEstado] = useState(null);
  const [guardandoId, setGuardandoId] = useState(null);
  const dragIdRef = useRef(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await obtenerKanban();
      setTablero(resultado);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // --- Drag & drop ---
  const manejarDragStart = (e, pedido) => {
    dragIdRef.current = pedido.id;
    setArrastrando(pedido);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(pedido.id));
    } catch {
      /* algunos navegadores restringen setData en dragStart */
    }
  };

  const manejarDragOver = (e, estado) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (sobreEstado !== estado) setSobreEstado(estado);
  };

  const manejarDragLeave = (e, estado) => {
    if (e.currentTarget === e.target && sobreEstado === estado) {
      setSobreEstado(null);
    }
  };

  const manejarDrop = async (e, estado) => {
    e.preventDefault();
    const id = dragIdRef.current ?? Number(e.dataTransfer.getData("text/plain"));
    setSobreEstado(null);
    setArrastrando(null);

    if (!id) return;

    // Buscar el pedido en el tablero actual para un update optimista.
    const pedido = Object.values(tablero ?? {})
      .flat()
      .find((p) => p.id === id);

    if (!pedido || pedido.estado === estado) return;

    // Movimiento optimista: quitar de la columna origen y añadir al destino.
    setTablero((prev) => {
      const siguiente = { ...prev };
      Object.keys(siguiente).forEach((clave) => {
        siguiente[clave] = siguiente[clave].filter((p) => p.id !== id);
      });
      siguiente[estado] = [pedido, ...(siguiente[estado] ?? [])];
      return siguiente;
    });

    setGuardandoId(id);
    setMensaje(null);
    try {
      const actualizado = await cambiarEstadoPedido(id, estado);
      setMensaje(`Pedido #${id} movido a "${tituloDe(estado)}".`);
      // Ajustar con la respuesta del servidor (estado real).
      setTablero((prev) => {
        const siguiente = { ...prev };
        Object.keys(siguiente).forEach((clave) => {
          siguiente[clave] = siguiente[clave].map((p) =>
            p.id === id ? { ...p, estado: actualizado.estado } : p
          );
        });
        return siguiente;
      });
    } catch (err) {
      setMensaje(null);
      setError(getErrorMessage(err));
      // Revertir: recargar el tablero desde el servidor.
      cargar();
    } finally {
      setGuardandoId(null);
    }
  };

  const manejarDragEnd = () => {
    dragIdRef.current = null;
    setArrastrando(null);
    setSobreEstado(null);
  };

  const tituloDe = (estado) =>
    COLUMNAS.find((c) => c.estado === estado)?.titulo ?? estado;

  const contarTotal = (tableroActual) =>
    Object.values(tableroActual ?? {}).reduce(
      (suma, lista) => suma + (lista?.length ?? 0),
      0
    );

  const renderColumna = (columna) => {
    const pedidos = tablero?.[columna.estado] ?? [];
    const resaltada =
      sobreEstado === columna.estado && (arrastrando || dragIdRef.current);

    return (
      <div
        key={columna.estado}
        onDragOver={(e) => manejarDragOver(e, columna.estado)}
        onDragLeave={(e) => manejarDragLeave(e, columna.estado)}
        onDrop={(e) => manejarDrop(e, columna.estado)}
        className={`flex min-h-[200px] w-full flex-col rounded-2xl border bg-gray-50/60 transition dark:bg-slate-900/60 lg:w-72 ${
          resaltada
            ? "border-indigo-400 ring-2 ring-indigo-500/30 dark:border-cyan-400"
            : "border-gray-200 dark:border-slate-800"
        }`}
      >
        {/* Encabezado de columna */}
        <div
          className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${COLOR_HEADER[columna.color]}`}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            {columna.titulo}
          </span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold dark:bg-slate-800/80">
            {pedidos.length}
          </span>
        </div>

        {/* Tarjetas */}
        <div className="flex flex-1 flex-col gap-3 p-3">
          {pedidos.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400 dark:text-slate-500">
              Sin pedidos
            </p>
          ) : (
            pedidos.map((pedido) => (
              <div
                key={pedido.id}
                draggable
                onDragStart={(e) => manejarDragStart(e, pedido)}
                onDragEnd={manejarDragEnd}
                className={`group cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 ${
                  arrastrando?.id === pedido.id
                    ? "opacity-40 ring-2 ring-indigo-500/40 dark:ring-cyan-500/40"
                    : "hover:shadow-md hover:ring-1 hover:ring-indigo-300 dark:hover:ring-cyan-500/40"
                } ${guardandoId === pedido.id ? "pointer-events-none opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-900 dark:text-white">
                    #{pedido.id}
                  </p>
                  <FaGripVertical className="mt-0.5 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600" />
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-slate-300">
                  {pedido.usuario}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <span>{formatFechaHora(pedido.creadoEn)}</span>
                  {pedido.tieneDiseno && (
                    <span
                      className="flex items-center gap-1 text-violet-600 dark:text-violet-400"
                      title="Incluye diseño personalizado"
                    >
                      <FaPalette /> Diseño
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice(pedido.total)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                    <FaBox /> {pedido.cantidadItems} und
                  </span>
                </div>
                {pedido.guiaEnvio && (
                  <p className="mt-2 truncate rounded-lg bg-gray-100 px-2 py-1 text-[11px] text-gray-500 dark:bg-slate-700/60 dark:text-slate-300">
                    Guía: {pedido.guiaEnvio}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <FaIndustry className="text-indigo-600 dark:text-cyan-400" />
            Tablero de producción
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Arrastra los pedidos entre columnas para avanzar en el flujo de
            producción.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && (
            <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <FaCheckCircle className="mr-1 inline text-emerald-500" />
              {contarTotal(tablero)} pedidos en producción
            </span>
          )}
          <Button
            variant="outline"
            onClick={cargar}
            leftIcon={<FaUndo />}
            disabled={loading}
          >
            Refrescar
          </Button>
        </div>
      </div>

      {mensaje && (
        <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
          {mensaje}
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loading label="Cargando tablero de producción..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={cargar}>
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:overflow-x-auto lg:pb-4">
          {COLUMNAS.map(renderColumna)}
        </div>
      )}
    </div>
  );
}

export default Produccion;
