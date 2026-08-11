import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import CartIcon from "../cart/CartIcon";

function Navbar() {
  const navigate = useNavigate();
  const { usuario, cerrarSesion } = useAuth();

  const handleLogout = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
        >
          SKD
        </Link>

        <div className="hidden md:flex gap-8 text-slate-300">

          <Link to="/" className="hover:text-cyan-400 transition">
            Inicio
          </Link>

          <Link to="/catalogo" className="hover:text-cyan-400 transition">
            Catálogo
          </Link>

          <Link to="/generador" className="hover:text-cyan-400 transition">
            Diseña con IA
          </Link>

          <Link to="/" className="hover:text-cyan-400 transition">
            Contacto
          </Link>

        </div>

        {usuario ? (
          <div className="flex items-center gap-3">
            <CartIcon />

            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              <FaUserCircle className="text-lg" />
              <span className="max-w-[120px] truncate">
                {usuario.nombre?.split(" ")[0] || usuario.username}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-400 hover:text-red-400 transition"
            >
              <FaSignOutAlt className="text-lg" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CartIcon />

            <Link
              to="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              Iniciar sesión
            </Link>

            <Link
              to="/registro"
              className="rounded-lg bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 font-semibold text-white hover:scale-105 transition"
            >
              Registrarse
            </Link>

          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;