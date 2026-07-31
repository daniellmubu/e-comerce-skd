import { useNavigate } from "react-router-dom";
import { FaMagic, FaShoppingBag, FaPalette, FaSignOutAlt } from "react-icons/fa";

import { obtenerUsuarioActual, logout } from "../services/authService";

const ROL_LABELS = {
  cliente: "Cliente",
  admin: "Administrador",
  disenador: "Diseñador",
};

function Dashboard() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioActual();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Fallback defensivo: RutaProtegida ya evita llegar aquí sin sesión,
  // pero si localStorage se limpió manualmente evitamos un crash.
  if (!usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-300">
        <div>
          <p className="mb-4">No se pudo cargar tu sesión.</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 font-semibold text-white"
          >
            Iniciar sesión de nuevo
          </button>
        </div>
      </div>
    );
  }

  const rolLabel = ROL_LABELS[usuario.rol] || usuario.rol;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-16 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300">
              {rolLabel}
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Hola, {usuario.nombre.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-slate-400">
              Este es tu panel en SKD. Desde aquí puedes seguir creando y
              revisar tu actividad.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-400"
          >
            <FaSignOutAlt />
            Cerrar sesión
          </button>
        </div>

        {/* Accesos rápidos */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          <button
            onClick={() => navigate("/generador")}
            className="group flex items-center gap-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-left shadow-lg backdrop-blur transition hover:border-cyan-400/50 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-xl">
              <FaMagic />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Diseña con IA
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Crea un nuevo diseño desde un prompt
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/catalogo")}
            className="group flex items-center gap-5 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-left shadow-lg backdrop-blur transition hover:border-cyan-400/50 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-xl">
              <FaShoppingBag />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                Ver catálogo
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Explora productos disponibles para personalizar
              </p>
            </div>
          </button>
        </div>

        {/* Mis diseños */}
        <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Mis diseños
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            Los diseños que generes con IA aparecerán aquí una vez guardados.
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-14 text-center">
            <FaPalette className="mb-4 text-3xl text-slate-600" />
            <p className="text-slate-400">Aún no tienes diseños guardados.</p>
            <button
              onClick={() => navigate("/generador")}
              className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              Crear mi primer diseño
            </button>
          </div>
        </section>

        {/* Mis pedidos */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur">
          <h2 className="mb-2 text-xl font-semibold text-white">
            Mis pedidos
          </h2>
          <p className="mb-6 text-sm text-slate-400">
            El historial de tus compras aparecerá aquí.
          </p>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-14 text-center">
            <FaShoppingBag className="mb-4 text-3xl text-slate-600" />
            <p className="text-slate-400">Revisa el historial de tus compras.</p>
            <button
              onClick={() => navigate("/mis-pedidos")}
              className="mt-4 rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-cyan-400"
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