import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────
// CRÉDITOS DE MODELOS 3D - CC-BY-4.0 requiere atribución visible
// Mantener esta página enlazada desde el footer (Footer.jsx -> /creditos)
// Ver también frontend/public/models/license.txt y jarra-cervecera.gltf asset.extras
// ─────────────────────────────────────────────────────────────────────
const MODELOS_CREDITOS = [
  {
    nombre: "Mug / Mug Mágico",
    autor: "Modelo base mug.gltf (mismo objeto para Mug y Mug Mágico)",
    fuente: "Proyecto SKD / Sketchfab (ver historial)",
    enlace: "https://sketchfab.com/3d-models/plain-mug-19c8fe5702b544d0a1409d3dac1cf90e",
    licencia: "CC-BY-4.0 (si aplica) - ver archivo del modelo",
  },
  {
    nombre: "Beer Jar / Jarra Cervecera 500ml",
    autor: "Pxto (https://sketchfab.com/joselargo8)",
    fuente: "Sketchfab",
    enlace: "https://sketchfab.com/3d-models/beer-jar-ff7bf48e13fe44a5b2476d382f345507",
    licencia: "CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)",
  },
];

function Creditos() {
  return (
    <section className="min-h-screen bg-gray-50 px-6 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Créditos de modelos 3D
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-slate-400">
          Los modelos 3D usados en el personalizador pertenecen a sus
          respectivos autores y se utilizan bajo licencia Creative Commons
          Attribution.
        </p>

        <div className="space-y-4">
          {MODELOS_CREDITOS.map((modelo) => (
            <article
              key={modelo.nombre}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {modelo.nombre}
              </h2>

              <dl className="mt-3 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-gray-500 dark:text-slate-400">
                    Autor
                  </dt>
                  <dd>{modelo.autor}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-gray-500 dark:text-slate-400">
                    Fuente
                  </dt>
                  <dd>{modelo.fuente}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-gray-500 dark:text-slate-400">
                    Modelo
                  </dt>
                  <dd>
                    {modelo.enlace ? (
                      <a
                        href={modelo.enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 underline-offset-2 transition hover:underline dark:text-cyan-400"
                      >
                        Ver modelo original
                      </a>
                    ) : (
                      <span className="italic text-gray-400 dark:text-slate-500">
                        [enlace pendiente]
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 font-medium text-gray-500 dark:text-slate-400">
                    Licencia
                  </dt>
                  <dd>
                    {modelo.licencia}{" "}
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline-offset-2 transition hover:underline dark:text-cyan-400"
                    >
                      (ver licencia)
                    </a>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <Link
          to="/"
          className="mt-8 inline-block text-sm font-medium text-indigo-600 transition hover:underline dark:text-cyan-400"
        >
          ← Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default Creditos;
