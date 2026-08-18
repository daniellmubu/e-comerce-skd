import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShoppingBag } from "react-icons/fa";

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
  recibido: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  en_proceso: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  enviado: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  entregado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelado: "border-red-500/30 bg-red-500/10 text-red-300",
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
      const data = await listarPedidosPorUsuario();
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
    <section className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-cyan-300">
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
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center">
            <p className="text-red-400">{error}</p>
            <button
              type="button"
              onClick={cargarPedidos}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-300 transition hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 py-20 text-center text-slate-400">
            <FaShoppingBag className="mb-4 text-4xl text-slate-600" />
            <p>Todavía no has hecho ningún pedido.</p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white transition hover:scale-105"
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
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">
                      Pedido #{pedido.id} · {formatFecha(pedido.creadoEn)}
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {formatPrice(pedido.total)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
                      ESTADO_ESTILOS[pedido.estado] ||
                      "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    {pedido.estado?.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 text-sm text-slate-400">
                  <div>
                    <p className="text-slate-500">Subtotal</p>
                    <p className="text-slate-200">{formatPrice(pedido.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Envío</p>
                    <p className="text-slate-200">{formatPrice(pedido.costoEnvio)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Descuento</p>
                    <p className="text-slate-200">-{formatPrice(pedido.descuento)}</p>
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
