import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaKey, FaArrowLeft, FaCheckCircle } from "react-icons/fa";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { solicitarRestablecerPassword } from "../services/authService";
import { getErrorMessage } from "../services/api";

function OlvidePassword() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!correo.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await solicitarRestablecerPassword(correo.trim());
      setEnviado(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <FaCheckCircle />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Revisa tu correo
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Si <strong>{correo.trim()}</strong> está registrado, recibirás un
            enlace para restablecer tu contraseña. Revisa también la carpeta de
            spam.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
          >
            <FaArrowLeft /> Volver a iniciar sesión
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg">
            <FaKey />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Escribe tu correo y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          noValidate
        >
          <Input
            label="Correo electrónico"
            placeholder="tucorreo@correo.com"
            type="email"
            icon={<FaEnvelope />}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
          />

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading} disabled={!correo.trim()}>
            Enviar enlace
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            ¿Recordaste tu contraseña?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
            >
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default OlvidePassword;
