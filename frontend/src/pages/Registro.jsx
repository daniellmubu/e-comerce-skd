import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaGift } from "react-icons/fa";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { registrarse, enviarCodigoRegistro } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "2026-09-18" -> "18/09/2026"
function formatearFecha(iso) {
  if (!iso) return "";
  const [anio, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${anio}`;
}

function Registro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { actualizarSesion } = useAuth();
  const refCode = searchParams.get("ref");

  const [form, setForm] = useState({
    nombre: "",
    username: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bienvenida, setBienvenida] = useState(null);
  const [paso, setPaso] = useState(1);
  const [codigo, setCodigo] = useState("");
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [reenviado, setReenviado] = useState(false);

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

  const handleEnviarCodigo = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setEnviandoCodigo(true);
    setReenviado(false);
    try {
      await enviarCodigoRegistro(form.correo.trim());
      setPaso(2);
      setErrors({});
    } catch (err) {
      const message = getErrorMessage(err);
      if (message.toLowerCase().includes("username")) setErrors({ username: message });
      else if (message.toLowerCase().includes("correo")) setErrors({ correo: message });
      else setErrors({ general: message });
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const handleReenviar = async () => {
    try {
      await enviarCodigoRegistro(form.correo.trim());
      setReenviado(true);
      setErrors((prev) => ({ ...prev, general: undefined, codigo: undefined }));
    } catch (err) {
      setErrors({ general: getErrorMessage(err) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paso === 1) {
      await handleEnviarCodigo();
      return;
    }

    if (!/^\d{6}$/.test(codigo)) {
      setErrors({ codigo: "Ingresa el código de 6 dígitos." });
      return;
    }
    setErrors((prev) => ({ ...prev, codigo: undefined }));

    setLoading(true);
    try {
      const respuesta = await registrarse({
        nombre: form.nombre.trim(),
        username: form.username.trim(),
        correo: form.correo.trim(),
        password: form.password,
        codigoReferido: refCode || undefined,
        codigo: codigo.trim(),
      });
      actualizarSesion();
      if (respuesta.cuponBienvenida) {
        setBienvenida({
          nombre: form.nombre.trim(),
          ...respuesta.cuponBienvenida,
        });
      } else {
        navigate("/dashboard");
      }
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
          Crea tu cuenta
        </h1>
        <p className="mt-2 text-center text-gray-500 dark:text-slate-400">
          Empieza a diseñar productos únicos con IA.
        </p>
        {refCode && (
          <p className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Te invitaron con el código <span className="font-bold">{refCode}</span>
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold">
          <span className={paso === 1 ? "text-indigo-600 dark:text-cyan-300" : "text-emerald-600 dark:text-emerald-400"}>
            1 · Tus datos
          </span>
          <span className="text-gray-300 dark:text-slate-600">—</span>
          <span className={paso === 2 ? "text-indigo-600 dark:text-cyan-300" : "text-gray-400 dark:text-slate-500"}>
            2 · Verifica tu correo
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
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

          {paso === 2 && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-cyan-500/30 dark:bg-cyan-500/10">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                Te enviamos un código de 6 dígitos a{" "}
                <strong>{form.correo}</strong>. Es válido por 5 minutos.
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="Código de 6 dígitos"
                className="mt-3 w-full rounded-xl border border-indigo-300 bg-white px-4 py-3 text-center text-lg font-bold tracking-widest text-gray-900 outline-none transition focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              {errors.codigo && (
                <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
                  {errors.codigo}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleReenviar}
                  className="font-semibold text-indigo-600 hover:underline dark:text-cyan-400"
                >
                  {reenviado ? "Código reenviado ✓" : "¿No te llegó? Reenviar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="text-gray-500 hover:underline dark:text-slate-400"
                >
                  ← Editar datos
                </button>
              </div>
            </div>
          )}

          {errors.general && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {errors.general}
            </p>
          )}

          <Button type="submit" fullWidth loading={paso === 1 ? enviandoCodigo : loading}>
            {paso === 1
              ? enviandoCodigo
                ? "Enviando código..."
                : "Enviar código de verificación"
              : loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            Inicia sesión
          </Link>
        </p>
      </div>

      {bienvenida && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => navigate("/dashboard")}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_0_45px_rgba(34,211,238,0.15)]">
            <FaGift className="mx-auto mb-4 text-5xl text-emerald-500" />

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ¡Bienvenido, {bienvenida.nombre}!
            </h2>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Te regalamos un cupón del{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Number(bienvenida.descuentoPorcentaje)}%
              </span>{" "}
              para que lo uses en tu primera compra.
            </p>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50 p-5 dark:border-cyan-400/60 dark:bg-cyan-400/5">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-cyan-300">
                Tu código de descuento
              </p>
              <p className="mt-2 text-2xl font-black tracking-widest text-indigo-700 dark:text-cyan-300">
                {bienvenida.codigo}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Vence el {formatearFecha(bienvenida.fechaVencimiento)}
              </p>
            </div>

            <div className="mt-6">
              <Button fullWidth onClick={() => navigate("/catalogo")}>
                Usar mi cupón ahora
              </Button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registro;