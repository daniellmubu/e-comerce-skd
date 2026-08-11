import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { registrarse } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Registro() {
  const navigate = useNavigate();
  const { actualizarSesion } = useAuth();

  const [form, setForm] = useState({
    nombre: "",
    username: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio";

    if (!form.username.trim())
      nextErrors.username = "El usuario es obligatorio";

    if (!form.correo.trim()) {
      nextErrors.correo = "El correo es obligatorio";
    } else if (!EMAIL_REGEX.test(form.correo.trim())) {
      nextErrors.correo = "El correo no tiene un formato válido";
    }

    if (!form.password) {
      nextErrors.password = "La contraseña es obligatoria";
    } else if (form.password.length < 6) {
      nextErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!form.confirmarPassword) {
      nextErrors.confirmarPassword = "Confirma tu contraseña";
    } else if (form.confirmarPassword !== form.password) {
      nextErrors.confirmarPassword = "Las contraseñas no coinciden";
    }

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
      await registrarse({
        nombre: form.nombre.trim(),
        username: form.username.trim(),
        correo: form.correo.trim(),
        password: form.password,
      });
      actualizarSesion();
      navigate("/dashboard");
    } catch (err) {
      const message = getErrorMessage(err);

      if (message.toLowerCase().includes("username")) {
        setErrors({ username: message });
      } else if (message.toLowerCase().includes("correo")) {
        setErrors({ correo: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 animate-pulse rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-[0_0_45px_rgba(34,211,238,0.08)] backdrop-blur">
        <Link
          to="/"
          className="mb-8 block text-center text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent"
        >
          SKD
        </Link>

        <h1 className="text-center text-3xl font-bold text-white">
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-center text-slate-400">
          Empieza a diseñar productos únicos con IA.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <Input
            id="nombre"
            name="nombre"
            label="Nombre"
            placeholder="Tu nombre completo"
            autoComplete="name"
            value={form.nombre}
            onChange={handleChange}
            error={errors.nombre}
          />

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
            id="correo"
            name="correo"
            type="email"
            label="Correo"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            value={form.correo}
            onChange={handleChange}
            error={errors.correo}
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Input
            id="confirmarPassword"
            name="confirmarPassword"
            type="password"
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            value={form.confirmarPassword}
            onChange={handleChange}
            error={errors.confirmarPassword}
          />

          {errors.general && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {errors.general}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-8 text-center text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;