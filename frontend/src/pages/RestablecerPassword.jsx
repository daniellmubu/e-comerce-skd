import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { restablecerPassword } from "../services/authService";
import { getErrorMessage } from "../services/api";

function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("El enlace es inválido o está incompleto. Revisa el correo.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await restablecerPassword(token, password);
      setExito(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <FaCheckCircle />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Contraseña actualizada
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg">
            <FaLock />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nueva contraseña
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          noValidate
        >
          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            type="password"
            icon={<FaLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            type="password"
            icon={<FaLock />}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            autoComplete="new-password"
          />

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          {!token && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <FaExclamationTriangle className="mr-1 inline" /> Enlace inválido
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Guardar contraseña
          </Button>

          <p className="text-center text-sm text-gray-500 dark:text-slate-400">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
            >
              <FaArrowLeft /> Volver a iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default RestablecerPassword;
