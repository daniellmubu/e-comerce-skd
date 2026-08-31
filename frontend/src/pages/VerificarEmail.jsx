import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft } from "react-icons/fa";

import { verificarEmail } from "../services/authService";
import { getErrorMessage } from "../services/api";

function VerificarEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      setMensaje("El enlace es inválido o está incompleto.");
      return;
    }

    let activo = true;
    verificarEmail(token)
      .then(() => {
        if (activo) setEstado("ok");
      })
      .catch((err) => {
        if (activo) {
          setEstado("error");
          setMensaje(getErrorMessage(err));
        }
      });

    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        {estado === "cargando" && (
          <>
            <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-indigo-600 dark:text-cyan-400" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Verificando tu correo...
            </h1>
          </>
        )}

        {estado === "ok" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <FaCheckCircle />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Correo verificado
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Tu cuenta está activa. Ya puedes iniciar sesión.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
            >
              <FaArrowLeft /> Ir a iniciar sesión
            </Link>
          </>
        )}

        {estado === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-500 dark:bg-red-500/20 dark:text-red-400">
              <FaExclamationTriangle />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              No se pudo verificar
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {mensaje}
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
            >
              <FaArrowLeft /> Volver al inicio
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default VerificarEmail;