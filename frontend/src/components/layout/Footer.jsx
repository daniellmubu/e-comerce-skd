import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-500 py-6 mt-10 dark:bg-slate-900 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p>© 2026 SKD - Creando Sueños</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          <Link
            to="/legal/terminos"
            className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
          >
            Términos y condiciones
          </Link>
          <Link
            to="/legal/privacidad"
            className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
          >
            Política de privacidad
          </Link>
          <Link
            to="/legal/envios"
            className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
          >
            Envíos y devoluciones
          </Link>
          <Link
            to="/creditos"
            className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
          >
            Créditos 3D
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
