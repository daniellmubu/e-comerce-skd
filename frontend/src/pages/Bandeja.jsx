import { useEffect, useState } from "react";
import {
  FaInbox,
  FaCheckCircle,
  FaRegCircle,
  FaCheckDouble,
  FaPaperPlane,
  FaTruck,
  FaSpinner,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import {
  listarNotificaciones,
  contarNoLeidas,
  marcarLeida,
  marcarTodasLeidas,
} from "../services/notificacionService";
import { useTopicRealtime } from "../hooks/useTopicRealtime";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

function formatFecha(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function IconoTipo({ tipo }) {
  if (tipo?.startsWith("PEDIDO")) return <FaTruck className="text-indigo-500 dark:text-cyan-400" />;
  return <FaPaperPlane className="text-indigo-500 dark:text-cyan-400" />;
}

function Bandeja() {
  const { usuario } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [marcandoId, setMarcandoId] = useState(null);

  useEffect(() => {
    if (!usuario) return undefined;

    let activo = true;

    Promise.all([listarNotificaciones(), contarNoLeidas()])
      .then(([notif, count]) => {
        if (!activo) return;
        setNotificaciones(Array.isArray(notif) ? notif : []);
        setNoLeidas(Number(count) || 0);
        setCargando(false);
      })
      .catch((err) => {
        if (!activo) return;
        setError(getErrorMessage(err));
        setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuario]);

  const recargar = () => {
    if (!usuario) return;
    listarNotificaciones()
      .then((data) => setNotificaciones(Array.isArray(data) ? data : []))
      .catch(() => {});
    contarNoLeidas()
      .then((count) => setNoLeidas(Number(count) || 0))
      .catch(() => {});
  };

  useTopicRealtime(
    usuario ? [`/topic/notificaciones/${usuario.id}`] : [],
    recargar
  );

  const handleMarcarLeida = async (id) => {
    setMarcandoId(id);
    try {
      await marcarLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMarcandoId(null);
    }
  };

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (cargando) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loading label="Cargando tu bandeja..." />
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Bandeja de entrada
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Notificaciones</h1>
          <p className="mt-3 text-gray-500 dark:text-slate-400">
            Propuestas de diseño, cambios en tus pedidos y novedades de SKD.
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-center text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
            <FaInbox className="text-gray-400" />
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo leído"}
          </span>
          {noLeidas > 0 && (
            <button
              type="button"
              onClick={handleMarcarTodas}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
            >
              <FaCheckDouble /> Marcar todas como leídas
            </button>
          )}
        </div>

        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaInbox className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>No tienes notificaciones todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((n) => (
              <div
                key={n.id}
                className={`rounded-2xl border p-5 transition ${
                  n.leida
                    ? "border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
                    : "border-indigo-300 bg-indigo-50/60 dark:border-cyan-500/30 dark:bg-cyan-500/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-cyan-500/20">
                      <IconoTipo tipo={n.tipo} />
                    </span>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {n.titulo}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-slate-300">
                        {n.mensaje}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                        {formatFecha(n.creadoEn)}
                      </p>
                    </div>
                  </div>

                  {!n.leida && (
                    <button
                      type="button"
                      onClick={() => handleMarcarLeida(n.id)}
                      disabled={marcandoId === n.id}
                      title="Marcar como leída"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-indigo-100 hover:text-indigo-600 disabled:opacity-50 dark:hover:bg-cyan-500/20 dark:hover:text-cyan-300"
                    >
                      {marcandoId === n.id ? (
                        <FaSpinner className="animate-spin text-xs" />
                      ) : (
                        <FaRegCircle />
                      )}
                    </button>
                  )}

                  {n.leida && (
                    <FaCheckCircle className="shrink-0 text-emerald-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Bandeja;