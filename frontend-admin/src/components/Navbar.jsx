import { FaBars } from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

/**
 * Barra superior del panel admin.
 * Muestra el botón de menú (móvil), el nombre de la página y el usuario.
 */
function Navbar({ onMenuClick, pageTitle }) {
  const { usuario } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-300 lg:hidden"
      >
        <FaBars />
      </button>

      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        {pageTitle}
      </h1>

      <div className="ml-auto hidden text-right sm:block">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {usuario?.nombre || "Administrador"}
        </p>
        <p className="text-xs capitalize text-gray-500 dark:text-slate-400">
          {usuario?.rol || "admin"}
        </p>
      </div>
    </header>
  );
}

export default Navbar;
