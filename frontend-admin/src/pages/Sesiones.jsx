import { useCallback, useEffect, useState } from "react";
import {
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaLaptop,
  FaShieldAlt,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";

import {
  listarSesiones,
  cerrarSesion,
  cerrarOtrasSesiones,
} from "../api/sesionesApi";
import { getErrorMessage } from "../api/axios";
import Button from "../components/Button";
import Loading from "../components/Loading";
import Badge from "../components/Badge";
import { formatFechaHora } from "../utils/formato";

function IconoDispositivo({ dispositivo }) {
  const d = (dispositivo || "").toLowerCase();
  if (d.includes("android") || d.includes("ios")) {
    return <FaMobileAlt className="text-2xl" />;
  }
  if (d.includes("ipad")) {
    return <FaTabletAlt className="text-2xl" />;
  }
  if (d.includes("windows") || d.includes("macos") || d.includes("linux")) {
    return <FaLaptop className="text-2xl" />;
  }
  return <FaDesktop className="text-2xl" />;
}

function Sesiones() {
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [cerrandoId, setCerrandoId] = useState(null);
  const [cerrandoOtras, setCerrandoOtras] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lista = await listarSesiones();
      setSesiones(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCerrar = async (id) => {
    setCerrandoId(id);
    setMensaje(null);
    try {
      await cerrarSesion(id);
      setMensaje({ tipo: "ok", texto: "Sesión cerrada correctamente." });
      await cargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setCerrandoId(null);
    }
  };

  const handleCerrarOtras = async () => {
    setCerrandoOtras(true);
    setMensaje(null);
    try {
      const res = await cerrarOtrasSesiones();
      const cuantas = res?.cerradas ?? 0;
      setMensaje({
        tipo: "ok",
        texto:
          cuantas > 0
            ? `Se cerraron ${cuantas} sesión${cuantas === 1 ? "" : "es"} en otros dispositivos.`
            : "No había otras sesiones abiertas.",
      });
      await cargar();
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setCerrandoOtras(false);
    }
  };

  const hayOtras = sesiones.some((s) => !s.esActual);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold">Sesiones activas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Dispositivos con tu cuenta de administrador abierta. Puedes cerrar
            cualquier sesión de forma remota.
          </p>
        </div>

        {hayOtras && (
          <Button
            variant="outline"
            loading={cerrandoOtras}
            leftIcon={<FaShieldAlt />}
            onClick={handleCerrarOtras}
          >
            Cerrar otras sesiones
          </Button>
        )}
      </div>

      {/* Aviso de seguridad */}
      <div className="flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
        <FaShieldAlt className="mt-0.5 shrink-0" />
        <p>
          Si detectas una sesión que no reconoces, ciérrala de inmediato y cambia
          tu contraseña. Cerrar una sesión revoca su acceso al instante; ese
          dispositivo tendrá que iniciar sesión de nuevo.
        </p>
      </div>

      {mensaje && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            mensaje.tipo === "error"
              ? "border-red-300 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
              : "border-green-300 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400"
          }`}
        >
          {mensaje.tipo === "ok" && <FaCheckCircle className="mr-2 inline" />}
          {mensaje.texto}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : sesiones.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No hay sesiones activas registradas para tu cuenta.
        </div>
      ) : (
        <div className="space-y-3">
          {sesiones.map((sesion) => {
            const cerrando = cerrandoId === sesion.id;
            return (
              <div
                key={sesion.id}
                className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center dark:bg-slate-900 ${
                  sesion.esActual
                    ? "border-cyan-300 dark:border-cyan-500/50"
                    : "border-gray-200 dark:border-slate-800"
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <IconoDispositivo dispositivo={sesion.dispositivo} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {sesion.dispositivo || "Dispositivo"}
                    </p>
                    {sesion.esActual && <Badge variant="cyan">Esta sesión</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    {sesion.navegador || "Navegador"} · IP{" "}
                    {sesion.ip || "desconocida"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                    Iniciada el {formatFechaHora(sesion.creadoEn)}
                  </p>
                </div>

                {!sesion.esActual && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={cerrando}
                    leftIcon={<FaTrash />}
                    onClick={() => handleCerrar(sesion.id)}
                    className="shrink-0 border-red-200 text-red-500 hover:border-red-400 dark:border-red-500/30 dark:text-red-400"
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Sesiones;
