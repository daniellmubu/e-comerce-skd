import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

import { obtenerUsuarioId } from "../services/authService";
import { listarPedidosPorUsuario } from "../services/pedidoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

function formatPrice(value) {
  return Number(value).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function formatFecha(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ESTADO_ESTILOS = {
  recibido: "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300",
  en_proceso: "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  enviado: "border-violet-300 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  entregado: "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  cancelado: "border-red-300 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
};

function MisPedidos() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    setLoading(true);
    try {
      const usuarioId = obtenerUsuarioId();
      const data = await listarPedidosPorUsuario(usuarioId);
      data.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
      setPedidos(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Historial
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Mis pedidos</h1>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loading label="Cargando tus pedidos..." />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={cargarPedidos}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaShoppingBag className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>Todavía no has hecho ningún pedido.</p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {!loading && !error && pedidos.length > 0 && (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Pedido #{pedido.id} · {formatFecha(pedido.creadoEn)}
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(pedido.total)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
                      ESTADO_ESTILOS[pedido.estado] ||
                      "border-gray-200 bg-gray-100 text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {pedido.estado?.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate(`/pedidos/${pedido.id}/seguimiento`)}
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                  >
                    Ver detalles
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 text-sm text-gray-500 dark:border-slate-800 dark:text-slate-400">
                  <div>
                    <p className="text-gray-400 dark:text-slate-500">Subtotal</p>
                    <p className="text-gray-700 dark:text-slate-200">{formatPrice(pedido.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-slate-500">Envío</p>
                    <p className="text-gray-700 dark:text-slate-200">{formatPrice(pedido.costoEnvio)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 dark:text-slate-500">Descuento</p>
                    <p className="text-gray-700 dark:text-slate-200">-{formatPrice(pedido.descuento)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default MisPedidos;
