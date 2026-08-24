import { useState } from "react";
import {
  FaMagic,
  FaSpinner,
  FaShoppingCart,
  FaDownload,
  FaExclamationTriangle,
} from "react-icons/fa";

import { generarDiseno, agregarDisenoAlCarrito } from "../../services/disenoService";
import { obtenerOCrearCarrito } from "../../services/carritoService";
import { getErrorMessage } from "../../services/api";

const ESTILOS = [
  { id: "caricatura", label: "Caricatura" },
  { id: "minimalista", label: "Minimalista" },
  { id: "retro", label: "Retro" },
  { id: "lineas", label: "Línea simple" },
];

// Descarga una imagen remota como archivo (el atributo `download` no funciona
// cruzando dominios, por eso se trae como blob).
async function descargarImagen(url) {
  const respuesta = await fetch(url);
  const blob = await respuesta.blob();
  const objectUrl = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = objectUrl;
  enlace.download = `diseno-ia-${Date.now()}.png`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(objectUrl);
}

function AIGenerator({ productoId, onGuardado }) {
  const [prompt, setPrompt] = useState("");
  const [estilo, setEstilo] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [diseno, setDiseno] = useState(null);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const imagenUrl =
    diseno?.imagenUrl ?? diseno?.url ?? diseno?.imagen ?? null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setMensaje(null);
    setDiseno(null);

    try {
      const resultado = await generarDiseno({
        prompt: prompt.trim(),
        productoId: productoId ?? null,
        estilo,
      });
      setDiseno(resultado);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAgregarAlCarrito = async () => {
    if (!diseno?.id) {
      setMensaje({ tipo: "error", texto: "Genera un diseño primero." });
      return;
    }
    if (!productoId) {
      setMensaje({ tipo: "error", texto: "Elige un producto antes de continuar." });
      return;
    }

    setIsSaving(true);
    setMensaje(null);

    try {
      const carrito = await obtenerOCrearCarrito();
      await agregarDisenoAlCarrito({
        carritoId: carrito.id,
        productoId,
        disenoId: diseno.id,
        cantidad: 1,
      });
      setMensaje({ tipo: "ok", texto: "Diseño agregado al carrito." });
      onGuardado?.(diseno);
    } catch (err) {
      setMensaje({ tipo: "error", texto: getErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controles */}
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-300">
            Describe tu diseño
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="Ej: un dragón japonés minimalista en tonos azules"
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            Estilo (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {ESTILOS.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setEstilo((actual) => (actual === op.id ? null : op.id))}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  estilo === op.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-cyan-400 dark:bg-cyan-950 dark:text-cyan-300"
                    : "border-gray-200 text-gray-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
        >
          {isGenerating ? (
            <>
              <FaSpinner className="animate-spin" /> Generando...
            </>
          ) : (
            <>
              <FaMagic /> Generar diseño
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-500 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-400">
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Vista previa / resultado */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
          Vista previa
        </h2>

        <div className="flex h-72 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-800">
          {isGenerating ? (
            <FaSpinner className="animate-spin text-3xl text-indigo-500 dark:text-cyan-400" />
          ) : imagenUrl ? (
            <img
              src={imagenUrl}
              alt="Diseño generado"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              Tu diseño aparecerá aquí.
            </p>
          )}
        </div>

        {diseno?.id && (
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAgregarAlCarrito}
              disabled={isSaving || !productoId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin" /> Agregando...
                </>
              ) : (
                <>
                  <FaShoppingCart /> Agregar al carrito
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => descargarImagen(imagenUrl)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-indigo-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400"
            >
              <FaDownload /> Descargar diseño
            </button>
          </div>
        )}

        {mensaje && (
          <p
            className={`mt-3 text-center text-sm ${
              mensaje.tipo === "error"
                ? "text-red-500"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {mensaje.texto}
          </p>
        )}
      </div>
    </div>
  );
}

export default AIGenerator;
