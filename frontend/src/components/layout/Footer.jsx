import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-500 py-6 mt-10 dark:bg-slate-900 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p>© 2026 SKD - Creando Sueños</p>
        <p className="mt-1 text-xs">
          <Link
            to="/creditos"
            className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
          >
            Créditos 3D
          </Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
