import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { toast } from "sonner";

import { suscribirNewsletter } from "../../services/newsletterService";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

function Footer() {
  const { usuario } = useAuth();
  const [correo, setCorreo] = useState(usuario?.correo ?? "");
  const [enviando, setEnviando] = useState(false);
  const manualRef = useRef(false);

  // Si el usuario ya inició sesión, pre-llenamos su correo (no se lo volvemos
  // a pedir). Solo lo rellenamos si no escribió manualmente otro.
  useEffect(() => {
    if (usuario?.correo && !manualRef.current) {
      setCorreo(usuario.correo);
    }
  }, [usuario?.correo]);

  const handleSuscribir = async (e) => {
    e.preventDefault();
    const email = correo.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresa un correo válido.");
      return;
    }
    setEnviando(true);
    try {
      await suscribirNewsletter(email);
      setCorreo("");
      toast.success("¡Gracias por suscribirte! Recibirás nuestras novedades.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <footer className="bg-gray-100 text-gray-500 py-6 mt-10 dark:bg-slate-900 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-6">
        {/* Newsletter */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white dark:bg-gradient-to-br dark:from-cyan-500 dark:to-violet-600">
              <FaEnvelope />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                Recibe novedades y promociones
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Suscríbete y entérate de lanzamientos y descuentos.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleSuscribir}
            className="flex w-full max-w-sm items-center gap-2"
          >
            <input
              type="email"
              value={correo}
              onChange={(e) => {
                manualRef.current = true;
                setCorreo(e.target.value);
              }}
              placeholder={usuario?.correo ? "Tu correo" : "tucorreo@correo.com"}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={enviando || !correo.trim()}
              aria-label="Suscribirme al newsletter"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              {enviando ? (
                <FaCheckCircle />
              ) : (
                <FaPaperPlane className="text-sm" />
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-200 pt-6 text-center dark:border-slate-800">
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
            <Link
              to="/contacto"
              className="underline-offset-2 transition hover:text-gray-700 hover:underline dark:hover:text-slate-200"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;