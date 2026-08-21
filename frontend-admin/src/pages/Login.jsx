import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { FaLock, FaShieldAlt, FaUser } from "react-icons/fa";

import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/axios";

function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión de admin, ir directo al dashboard.
  if (usuario?.rol === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      const destino = location.state?.from?.pathname || "/dashboard";
      navigate(destino, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-2xl text-white shadow-lg">
            <FaShieldAlt />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SKD Admin
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Panel administrativo de SKD Creando Sueños
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
        >
          <Input
            label="Usuario"
            placeholder="Ingresa tu usuario"
            icon={<FaUser />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            type="password"
            icon={<FaLock />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={!username.trim() || !password}
          >
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
