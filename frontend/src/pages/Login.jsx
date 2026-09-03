import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { login } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { actualizarSesion } = useAuth();

  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = "El usuario es obligatorio";
    if (!form.password) nextErrors.password = "La contraseña es obligatoria";
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      actualizarSesion();
      navigate("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err);
      // Mensajes específicos para TC-010 y TC-011
      if (msg.toLowerCase().includes("bloqueada")) {
        setErrors({ general: "Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador." });
      } else if (msg.toLowerCase().includes("verificar") || msg.toLowerCase().includes("verificado")) {
        setErrors({ general: "Debes verificar tu email antes de iniciar sesión. Revisa tu correo." });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 px-6 py-16 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-32 -top-32 hidden h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl dark:block" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 hidden h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl dark:block" />

      <div className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_0_45px_rgba(34,211,238,0.08)] dark:backdrop-blur">
        <Link
          to="/"
          className="mb-8 block text-center text-2xl font-bold text-indigo-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-violet-500 dark:bg-clip-text dark:text-transparent"
        >
          SKD
        </Link>

        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          Inicia sesión
        </h1>
        <p className="mt-2 text-center text-gray-500 dark:text-slate-400">
          Entra a tu cuenta para seguir creando con IA.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input
            id="username"
            name="username"
            label="Usuario"
            placeholder="tu_usuario"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="••••••••"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          {errors.general && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              <p>{errors.general}</p>
              {errors.general.toLowerCase().includes("verificar") && (
                <Link to="/verificar-email" className="mt-2 inline-block text-xs font-semibold underline">
                  Ir a verificar email
                </Link>
              )}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>

          <p className="text-center">
            <Link
              to="/olvide-password"
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-slate-400">
          ¿Aún no tienes cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
