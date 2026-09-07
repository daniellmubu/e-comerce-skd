import { useEffect, useState } from "react";
import { FaDesktop, FaMobileAlt, FaTrash, FaShieldAlt, FaCheckCircle } from "react-icons/fa";
import { listarSesiones, cerrarSesionRemota, cerrarOtrasSesiones } from "../services/sesionService";
import { getErrorMessage } from "../services/api";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";

function formatFecha(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

export default function MisDispositivos() {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [accion, setAccion] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await listarSesiones();
      setSesiones(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function handleCerrar(id) {
    setAccion(id);
    try { await cerrarSesionRemota(id); await cargar(); } catch (err) { setError(getErrorMessage(err)); } finally { setAccion(null); }
  }
  async function handleCerrarOtras() {
    setAccion("otras");
    try { await cerrarOtrasSesiones(); await cargar(); } catch (err) { setError(getErrorMessage(err)); } finally { setAccion(null); }
  }

  if (cargando) return <div className="flex justify-center py-20"><Loading label="Cargando dispositivos..." /></div>;

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dispositivos conectados</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Gestiona las sesiones activas de tu cuenta. Puedes cerrar remotamente cualquier dispositivo (máximo 5 activos).</p>
        </div>

        <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <div className="flex items-start gap-3">
            <FaShieldAlt className="mt-0.5 text-indigo-500" />
            <div>
              <p className="text-sm font-semibold text-indigo-900 dark:text-white">Seguridad</p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-700/70 dark:text-slate-400">Si ves un dispositivo que no reconoces, ciérralo de inmediato y cambia tu contraseña. Cada inicio de sesión crea una sesión con expiración de 24h.</p>
            </div>
          </div>
        </div>

        {error && <p className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        {sesiones.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-gray-500 dark:text-slate-400">No hay sesiones activas.</p>
            <Button className="mt-4" onClick={cargar}>Recargar</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <Button variant="outline" size="sm" loading={accion==="otras"} onClick={handleCerrarOtras}>Cerrar otras sesiones</Button>
            </div>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className={`flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-slate-900 ${s.esActual ? "border-emerald-400 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-500/5" : "border-gray-200 dark:border-slate-800"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.dispositivo?.toLowerCase().includes("android") || s.dispositivo === "iOS" ? "bg-gradient-to-br from-pink-500 to-rose-600" : "bg-gradient-to-br from-slate-600 to-slate-800"} text-white`}>
                      {s.dispositivo === "Android" || s.dispositivo === "iOS" ? <FaMobileAlt /> : <FaDesktop />}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        {s.dispositivo || "Dispositivo"} <span className="font-normal text-gray-500 dark:text-slate-400">· {s.navegador || "Navegador"}</span>
                        {s.esActual && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><FaCheckCircle /> Actual</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">IP {s.ip || "-"} · Iniciado {formatFecha(s.creadoEn)} · Expira {formatFecha(s.expiraEn)}</p>
                    </div>
                  </div>
                  {!s.esActual && (
                    <button onClick={() => handleCerrar(s.id)} disabled={accion===s.id} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400">
                      {accion===s.id ? "..." : <><FaTrash className="inline mr-1" /> Cerrar</>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
