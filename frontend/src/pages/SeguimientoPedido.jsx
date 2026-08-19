import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaBox, FaCheckCircle, FaCircle } from "react-icons/fa";

import { obtenerPedidoPorId } from "../services/pedidoService";
import { listarHistorialPedido } from "../services/historialPedidoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

// Pasos por defecto que se muestran siempre, en orden. Si el historial
// real del pedido trae estados que no calzan con ninguno de estos, se
// agregan igual al final para no perder información.
const PASOS_DEFECTO = ["recibido", "diseñando", "en_proceso", "enviado", "entregado"];

const ETIQUETAS = {
  recibido: "Recibido",
  diseñando: "Diseñando",
  en_proceso: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
  pendiente: "Recibido",
};

function formatFechaHora(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizar(estado) {
  return (estado || "").toLowerCase().trim();
}

function etiquetaDe(estado) {
  const clave = normalizar(estado);
  return ETIQUETAS[clave] || estado?.charAt(0).toUpperCase() + estado?.slice(1).replace("_", " ");
}

function formatPrice(value) {
  return Number(value ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

function SeguimientoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const [pedidoData, historialData] = await Promise.all([
        obtenerPedidoPorId(id),
        listarHistorialPedido(id).catch(() => []),
      ]);
      setPedido(pedidoData);
      setHistorial(historialData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Loading fullScreen label="Cargando seguimiento..." />;
  }

  if (error || !pedido) {
    return (
      <section className="min-h-screen bg-gray-50 px-6 py-24 text-center text-gray-900 dark:bg-slate-950 dark:text-white">
        <p className="text-red-500 dark:text-red-400">{error || "Pedido no encontrado."}</p>
        <button
          type="button"
          onClick={() => navigate("/mis-pedidos")}
          className="mt-6 rounded-xl border border-gray-200 px-6 py-3 text-gray-600 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
        >
          Volver a mis pedidos
        </button>
      </section>
    );
  }

  // Construye el timeline: primero los pasos ya alcanzados (con fecha,
  // en el orden en que ocurrieron), y luego los pasos por defecto que
  // todavía no se han alcanzado, en gris.
  const alcanzados = historial.map((h) => normalizar(h.estado));
  const pasosFuturos = PASOS_DEFECTO.filter((p) => !alcanzados.includes(p));

  const timeline = [
    ...historial.map((h) => ({
      estado: h.estado,
      fecha: h.fecha,
      alcanzado: true,
    })),
    ...pasosFuturos.map((p) => ({ estado: p, fecha: null, alcanzado: false })),
  ];

  const ultimoAlcanzado = historial[historial.length - 1];

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-10 text-3xl font-bold sm:text-4xl">
          Seguimiento de pedido
        </h1>

        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Pedido #{pedido.id} · Realizado el {formatFechaHora(pedido.creadoEn)}
            </p>

            <div className="mt-8 space-y-0">
              {timeline.map((paso, index) => {
                const esUltimo = index === timeline.length - 1;
                const esActual =
                  paso.alcanzado &&
                  ultimoAlcanzado &&
                  normalizar(paso.estado) === normalizar(ultimoAlcanzado.estado) &&
                  index === historial.length - 1;

                return (
                  <div key={`${paso.estado}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                          paso.alcanzado
                            ? esActual
                              ? "border-indigo-400 bg-indigo-50 text-indigo-600 dark:border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300"
                              : "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "border-gray-300 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600"
                        }`}
                      >
                        {paso.alcanzado ? (
                          esActual ? <FaBox /> : <FaCheckCircle />
                        ) : (
                          <FaCircle className="text-[8px]" />
                        )}
                      </span>
                      {!esUltimo && (
                        <span
                          className={`w-0.5 flex-1 ${
                            paso.alcanzado ? "bg-emerald-400 dark:bg-emerald-500/60" : "bg-gray-200 dark:bg-slate-800"
                          }`}
                          style={{ minHeight: "2.5rem" }}
                        />
                      )}
                    </div>

                    <div className="pb-10">
                      <p
                        className={`font-semibold ${
                          paso.alcanzado ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"
                        }`}
                      >
                        {etiquetaDe(paso.estado)}
                      </p>
                      {paso.fecha ? (
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          {formatFechaHora(paso.fecha)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-600">Pendiente</p>
                      )}
                      {esActual && (
                        <p className="mt-1 text-sm text-indigo-600 dark:text-cyan-300">
                          Estado actual · En proceso
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Resumen del pedido</h2>
              <div className="space-y-2 text-sm text-gray-500 dark:text-slate-400">
                <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-slate-800">
                  <span>Subtotal</span>
                  <span className="text-gray-700 dark:text-slate-200">{formatPrice(pedido.subtotal)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2 dark:border-slate-800">
                  <span>Envío</span>
                  <span className="text-gray-700 dark:text-slate-200">{formatPrice(pedido.costoEnvio)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(pedido.total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/mis-pedidos")}
                className="mt-6 w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
              >
                Ver todos mis pedidos
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SeguimientoPedido;
