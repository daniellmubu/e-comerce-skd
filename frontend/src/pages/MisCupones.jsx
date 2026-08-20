import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaTicketAlt } from "react-icons/fa";

import { listarMisCupones } from "../services/cuponService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

function formatFecha(iso) {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("T")[0].split("-");
  return `${dia}/${mes}/${anio}`;
}

function Seccion({ titulo, descripcion, cupones, vacio, children }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
        {titulo}
      </h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
        {descripcion}
      </p>

      {cupones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-slate-700">
          <FaTicketAlt className="mb-3 text-3xl text-gray-400 dark:text-slate-600" />
          <p className="text-sm text-gray-500 dark:text-slate-400">{vacio}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cupones.map((c) => (
            <div
              key={c.cuponId}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 p-5 dark:border-slate-700"
            >
              <div>
                <p className="text-2xl font-black tracking-widest text-indigo-700 dark:text-cyan-300">
                  {c.codigo}
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-slate-200">
                  {Number(c.descuentoPorcentaje)}% de descuento
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                  {formatFecha(c.fechaFin)}
                </p>
              </div>
              <div className="mt-4">{children(c)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MisCupones() {
  const navigate = useNavigate();
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarCupones();
  }, []);

  async function cargarCupones() {
    setLoading(true);
    try {
      const data = await listarMisCupones();
      setCupones(data);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const hoy = new Date().toISOString().split("T")[0];
  const disponibles = cupones.filter((c) => !c.usado && c.fechaFin >= hoy);
  const vencidos = cupones.filter((c) => !c.usado && c.fechaFin < hoy);
  const usados = cupones.filter((c) => c.usado);

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Mis beneficios
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Mis cupones</h1>
          <p className="mt-3 text-gray-500 dark:text-slate-400">
            Tus cupones de descuento, disponibles, usados y vencidos.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loading label="Cargando tus cupones..." />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-10 text-center dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-red-500 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={cargarCupones}
              className="mt-4 rounded-xl border border-red-400 px-5 py-2 text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && cupones.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 py-20 text-center text-gray-500 dark:border-slate-700 dark:text-slate-400">
            <FaTicketAlt className="mb-4 text-4xl text-gray-400 dark:text-slate-600" />
            <p>Todavía no tienes cupones asignados.</p>
            <p className="mt-1 text-sm">
              ¡Regístrate y recibe un cupón de bienvenida!
            </p>
            <button
              type="button"
              onClick={() => navigate("/catalogo")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              Ir al catálogo
            </button>
          </div>
        )}

        {!loading && !error && cupones.length > 0 && (
          <div className="space-y-6">
            <Seccion
              titulo="Disponibles"
              descripcion="Puedes usarlos en tu próxima compra."
              cupones={disponibles}
              vacio="No tienes cupones disponibles por ahora."
            >
              {() => (
                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                >
                  Usar en el checkout
                </button>
              )}
            </Seccion>

            <Seccion
              titulo="Usados"
              descripcion="Ya los aprovechaste en una compra anterior."
              cupones={usados}
              vacio="Aún no has usado ningún cupón."
            >
              {(c) => (
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Usado el {formatFecha(c.fechaUso)}
                </p>
              )}
            </Seccion>

            <Seccion
              titulo="Vencidos"
              descripcion="Se les acabó el tiempo de validez."
              cupones={vencidos}
              vacio="No tienes cupones vencidos."
            >
              {() => (
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Cupón vencido
                </p>
              )}
            </Seccion>
          </div>
        )}
      </div>
    </section>
  );
}

export default MisCupones;