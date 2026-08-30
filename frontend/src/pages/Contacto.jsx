import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaUser, FaCommentDots, FaCheckCircle, FaArrowLeft } from "react-icons/fa";

import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { enviarMensajeContacto } from "../services/contactoService";
import { getErrorMessage } from "../services/api";

function Contacto() {
  const [form, setForm] = useState({ nombre: "", correo: "", asunto: "", mensaje: "" });
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.nombre.trim() || !form.correo.trim() || form.mensaje.trim().length < 10) {
      setError("Completa nombre, correo y escribe un mensaje de al menos 10 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await enviarMensajeContacto({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        asunto: form.asunto.trim() || undefined,
        mensaje: form.mensaje.trim(),
      });
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
            Mensaje enviado
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
            Gracias por escribirnos. Te responderemos al correo{" "}
            <strong>{form.correo}</strong> lo antes posible.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-cyan-400"
          >
            <FaArrowLeft /> Volver al inicio
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
            Contacto
          </span>
          <h1 className="mt-6 text-4xl font-bold sm:text-5xl">Escríbenos</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-slate-400">
            ¿Dudas sobre un pedido, personalización o envío? Cuéntanos y te
            responderemos pronto.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
          noValidate
        >
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            name="nombre"
            icon={<FaUser />}
            value={form.nombre}
            onChange={handleChange}
          />
          <Input
            label="Correo electrónico"
            placeholder="tucorreo@correo.com"
            name="correo"
            type="email"
            icon={<FaEnvelope />}
            value={form.correo}
            onChange={handleChange}
            autoComplete="email"
          />
          <Input
            label="Asunto (opcional)"
            placeholder="Ej: estado de mi pedido"
            name="asunto"
            value={form.asunto}
            onChange={handleChange}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Mensaje
            </label>
            <div className="relative">
              <FaCommentDots className="pointer-events-none absolute left-4 top-4 text-gray-400 dark:text-slate-500" />
              <textarea
                name="mensaje"
                rows={5}
                value={form.mensaje}
                onChange={handleChange}
                placeholder="Cuéntanos en qué podemos ayudarte..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-cyan-400"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Enviar mensaje
          </Button>
        </form>
      </div>
    </section>
  );
}

export default Contacto;