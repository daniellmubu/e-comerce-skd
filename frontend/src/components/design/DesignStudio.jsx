import { useState } from "react";
import { FaPencilRuler, FaMagic } from "react-icons/fa";

import PersonalizationEditor from "./PersonalizationEditor";
import AIGenerator from "./AIGenerator";

const TABS = [
  { id: "manual", label: "Diseñador Manual (Canva)", icon: FaPencilRuler },
  { id: "ia", label: "Generar con IA", icon: FaMagic },
];

// Categoría del backend -> tipo de mockup interno del editor.
const TIPO_POR_CATEGORIA = {
  Camisetas: "camiseta",
  Mugs: "mug",
};

/**
 * Contenedor principal del estudio de diseño. Integra en una sola pantalla,
 * mediante pestañas, el editor manual (Konva) y el generador con IA.
 *
 * Props:
 *  - producto: objeto con { id, nombre, categoria, precio } (opcional).
 *  - productoId: id del producto al que se aplicará el diseño.
 *  - onGuardado: callback(diseno) al guardar/agregar al carrito.
 */
function DesignStudio({ producto, productoId, onGuardado }) {
  const [tab, setTab] = useState("manual");

  const tipoMockup =
    TIPO_POR_CATEGORIA[producto?.categoria] ?? "camiseta";

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <span className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm text-indigo-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">
          Estudio de diseño
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
          {producto?.nombre ?? "Personaliza tu producto"}
        </h1>
      </div>

      {/* Control de pestañas */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
          {TABS.map(({ id, label, icon: Icon }) => {
            const activo = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  activo
                    ? "bg-indigo-600 text-white shadow dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600"
                    : "text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "manual" ? (
        <PersonalizationEditor
          productoId={productoId}
          tipo={tipoMockup}
          onGuardado={onGuardado}
        />
      ) : (
        <AIGenerator productoId={productoId} onGuardado={onGuardado} />
      )}
    </section>
  );
}

export default DesignStudio;
