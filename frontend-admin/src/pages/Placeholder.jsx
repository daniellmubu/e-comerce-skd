import { FaTools } from "react-icons/fa";

import EmptyState from "../components/EmptyState";

/**
 * Página provisional para módulos del panel aún no implementados.
 * Se reemplaza por la página real de cada módulo en su fase correspondiente.
 */
function Placeholder({ titulo, descripcion }) {
  return (
    <div className="space-y-6">
      <EmptyState
        icon={<FaTools />}
        title={titulo}
        description={
          descripcion || "Este módulo está en construcción y se habilitará en su fase."
        }
      />
    </div>
  );
}

export default Placeholder;
