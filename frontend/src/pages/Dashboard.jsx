import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMagic,
  FaShoppingBag,
  FaPalette,
  FaSignOutAlt,
  FaDownload,
  FaRobot,
  FaPenNib,
} from "react-icons/fa";

import { obtenerUsuarioActual, logout } from "../services/authService";
import { listarDisenosPorUsuario } from "../services/disenoService";
import { getErrorMessage } from "../services/api";
import Loading from "../components/ui/Loading";

const ROL_LABELS = {
  cliente: "Cliente",
  admin: "Administrador",
  disenador: "Diseñador",
};

// Descarga una imagen remota como archivo (el atributo `download` no funciona
// cruzando dominios, por eso se trae como blob).
async function descargarDiseno(imagenUrl) {
  try {
    const respuesta = await fetch(imagenUrl);
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `diseno-skd-${Date.now()}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(imagenUrl, "_blank");
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioActual();

  const [disenos, setDisenos] = useState([]);
  const [cargandoDisenos, setCargandoDisenos] = useState(true);
  const [errorDisenos, setErrorDisenos] = useState(null);

  useEffect(() => {
    if (!usuario) return undefined;

    let activo = true;

    listarDisenosPorUsuario()
      .then((lista) => {
        if (activo) setDisenos(Array.isArray(lista) ? lista : []);
      })
      .catch((err) => {
        if (activo) {
          setErrorDisenos(getErrorMessage(err));
          setDisenos([]);
        }
      })
      .finally(() => {
        if (activo) setCargandoDisenos(false);
      });

    return () => {
      activo = false;
    };
  }, [usuario]);

  const reintentarCargarDisenos = () => {
    setErrorDisenos(null);
    setCargandoDisenos(true);
    listarDisenosPorUsuario()
      .then((lista) => {
        setDisenos(Array.isArray(lista) ? lista : []);
        setCargandoDisenos(false);
      })
      .catch((err) => {
        setErrorDisenos(getErrorMessage(err));
        setDisenos([]);
        setCargandoDisenos(false);
      });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Fallback defensivo: RutaProtegida ya evita llegar aquí sin sesión,
  // pero si localStorage se limpió manualmente evitamos un crash.
  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center text-gray-600 dark:bg-slate-950 dark:text-slate-300">
        <div>
          <p className="mb-4">No se pudo cargar tu sesión.</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
          >
            Iniciar sesión de nuevo
          </button>
        </div>
      </div>
    );
  }

  const rolLabel = ROL_LABELS[usuario.rol] || usuario.rol;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 hidden h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl dark:block" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 hidden h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl dark:block" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
              {rolLabel}
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Hola, {usuario.nombre.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Este es tu panel en SKD. Desde aquí puedes seguir creando y
              revisar tu actividad.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-medium text-gray-600 transition hover:border-red-400 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-500/50 dark:hover:text-red-400"
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>

        {/* Accesos rápidos */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          <button
            onClick={() => navigate("/personalizador")}
            className="group flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur dark:hover:border-cyan-400/50 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
              <FaMagic />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Diseña con IA
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Crea un nuevo diseño desde un prompt
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/catalogo")}
            className="group flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80 dark:backdrop-blur dark:hover:border-cyan-400/50 dark:hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
              <FaShoppingBag />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Ver catálogo
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Explora productos disponibles para personalizar
              </p>
            </div>
          </button>
        </div>

        {/* Mis diseños */}
        <section className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Mis diseños
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Tus diseños generados con IA o subidos desde el editor.
              </p>
            </div>
            {disenos.length > 0 && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                {disenos.length} {disenos.length === 1 ? "diseño" : "diseños"}
              </span>
            )}
          </div>

          {cargandoDisenos ? (
            <div className="flex justify-center py-14">
              <Loading label="Cargando tus diseños..." />
            </div>
          ) : errorDisenos ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-300 py-14 text-center dark:border-red-500/30">
              <p className="text-gray-500 dark:text-slate-400">{errorDisenos}</p>
              <button
                onClick={reintentarCargarDisenos}
                className="mt-4 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                Reintentar
              </button>
            </div>
          ) : disenos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-slate-700">
              <FaPalette className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
              <p className="text-gray-500 dark:text-slate-400">
                Aún no tienes diseños guardados.
              </p>
              <button
                onClick={() => navigate("/personalizador")}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
              >
                Crear mi primer diseño
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {disenos.map((diseno) => (
                <div
                  key={diseno.id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-800">
                    {diseno.imagenUrl ? (
                      <img
                        src={diseno.imagenUrl}
                        alt={diseno.prompt ?? "Diseño"}
                        className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <FaPalette className="text-3xl text-gray-300 dark:text-slate-600" />
                    )}
                    <span
                      className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        diseno.origen === "USUARIO"
                          ? "bg-indigo-100 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300"
                          : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                      }`}
                    >
                      {diseno.origen === "USUARIO" ? <FaPenNib /> : <FaRobot />}
                      {diseno.origen === "USUARIO" ? "Tu diseño" : "IA"}
                    </span>
                  </div>

                  <div className="p-4">
                    {diseno.producto && (
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {diseno.producto}
                      </p>
                    )}
                    {diseno.prompt && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-slate-400">
                        {diseno.prompt}
                      </p>
                    )}
                    <div className="mt-3 flex justify-end">
                      {diseno.imagenUrl && (
                        <button
                          onClick={() => descargarDiseno(diseno.imagenUrl)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                        >
                          <FaDownload /> Descargar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mis pedidos */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            Mis pedidos
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
            El historial de tus compras aparecerá aquí.
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-slate-700">
            <FaShoppingBag className="mb-4 text-3xl text-gray-400 dark:text-slate-600" />
            <p className="text-gray-500 dark:text-slate-400">Revisa el historial de tus compras.</p>
            <button
              onClick={() => navigate("/mis-pedidos")}
              className="mt-4 rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
            >
              Ver mis pedidos
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;