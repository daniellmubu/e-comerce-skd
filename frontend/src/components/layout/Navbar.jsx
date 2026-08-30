import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaSearch, FaSun, FaMoon, FaTicketAlt, FaHeart, FaBars, FaInbox } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useCart } from "../../context/CartContext";
import CartIcon from "../cart/CartIcon";
import { contarNoLeidas } from "../../services/notificacionService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, cerrarSesion } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { limpiarCarrito } = useCart();
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const esDisenador = usuario?.rol === "disenador";
  const esAdmin = usuario?.rol === "admin";

  useEffect(() => {
    if (!usuario) return undefined;

    let activo = true;
    contarNoLeidas()
      .then((count) => {
        if (activo) setNoLeidas(Number(count) || 0);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [usuario, location.pathname]);

  const handleLogout = () => {
    cerrarSesion();
    limpiarCarrito();
    navigate("/");
  };

  const toggleMenu = () => setMenuAbierto((v) => !v);
  const cerrarMenu = () => setMenuAbierto(false);

  // El buscador superior es la puerta de entrada al catálogo: navega con
  // ?q= para que el catálogo lo recoja y filtre.
  const handleBuscar = (e) => {
    if (e.key !== "Enter") return;
    const texto = busqueda.trim();
    navigate(texto ? `/catalogo?q=${encodeURIComponent(texto)}` : "/catalogo");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link
          to="/"
          className="shrink-0 text-2xl font-bold text-indigo-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500 dark:bg-clip-text dark:text-transparent"
        >
          SKD
        </Link>

        {/* Buscador estilo Figma (imagen 1) */}
        {!esDisenador && (
          <div className="relative hidden flex-1 max-w-md md:block">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleBuscar}
              className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pl-10 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>
        )}

        <div className="hidden items-center gap-6 text-gray-600 dark:text-slate-300 lg:flex">
          {esDisenador ? (
            <Link to="/disenador" className="transition hover:text-indigo-600 dark:hover:text-cyan-400">
              Panel diseñador
            </Link>
          ) : (
            <>
              <Link to="/catalogo" className="transition hover:text-indigo-600 dark:hover:text-cyan-400">
                Catálogo
              </Link>
              <Link to="/personalizador" className="transition hover:text-indigo-600 dark:hover:text-cyan-400">
                Diseña con IA
              </Link>
              <Link to="/solicitar-diseno" className="transition hover:text-indigo-600 dark:hover:text-cyan-400">
                Diseño asistido
              </Link>
              {esAdmin && (
                <Link to="/disenador" className="transition hover:text-indigo-600 dark:hover:text-cyan-400">
                  Panel diseñador
                </Link>
              )}
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>

          {!esDisenador && <CartIcon />}

          {usuario ? (
            <div className="flex items-center gap-2">
              <Link
                to={esDisenador ? "/disenador" : "/dashboard"}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                <FaUserCircle className="text-lg" />
                <span className="hidden max-w-[100px] truncate sm:inline">
                  {usuario.nombre?.split(" ")[0] || usuario.username}
                </span>
              </Link>

              {!esDisenador && (
                /* Menú hamburguesa: cupones, favoritos y bandeja */
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleMenu}
                    aria-label="Abrir menú"
                    aria-expanded={menuAbierto}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                  >
                    <FaBars className="text-lg" />
                  </button>

                  {menuAbierto && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={cerrarMenu}
                        aria-hidden="true"
                      />
                      <div className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <Link
                          to="/mis-cupones"
                          onClick={cerrarMenu}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <FaTicketAlt className="text-indigo-500 dark:text-cyan-400" />
                          Cupones
                        </Link>
                        <Link
                          to="/mis-favoritos"
                          onClick={cerrarMenu}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <FaHeart className="text-indigo-500 dark:text-cyan-400" />
                          Favoritos
                        </Link>
                        <Link
                          to="/bandeja"
                          onClick={cerrarMenu}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <span className="relative">
                            <FaInbox className="text-gray-400 dark:text-slate-500" />
                            {noLeidas > 0 && (
                              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                {noLeidas}
                              </span>
                            )}
                          </span>
                          Bandeja de entrada
                        </Link>
                        <div className="my-2 border-t border-gray-100 dark:border-slate-800" />
                        <button
                          type="button"
                          onClick={() => {
                            cerrarMenu();
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <FaSignOutAlt />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {esDisenador && (
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-gray-400 transition hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                >
                  <FaSignOutAlt className="text-lg" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                Iniciar sesión
              </Link>

              <Link
                to="/registro"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500 dark:hover:scale-105"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
