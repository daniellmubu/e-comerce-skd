import { NavLink } from "react-router-dom";
import { FaTimes, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";

/**
 * Sidebar del panel admin.
 * - Móvil: drawer deslizante controlado por open/onClose.
 * - Escritorio (lg+): columna fija.
 * Los ítems se resaltan con NavLink según la ruta activa.
 */
function Sidebar({ items = [], usuario, onLogout, open = false, onClose }) {
  const enlaceBase =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col bg-slate-950 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Encabezado */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <FaShieldAlt className="text-cyan-400" />
            SKD Admin
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <FaTimes />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `${enlaceBase} ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Pie */}
        {(usuario || onLogout) && (
          <div className="border-t border-slate-800 px-4 py-4">
            {usuario && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-800/60 px-3 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 font-bold text-white">
                  {usuario.nombre?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {usuario.nombre}
                  </p>
                  <p className="truncate text-xs capitalize text-slate-400">
                    {usuario.rol}
                  </p>
                </div>
              </div>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-400"
              >
                <FaSignOutAlt />
                Cerrar sesión
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
