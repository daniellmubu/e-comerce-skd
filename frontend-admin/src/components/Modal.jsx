import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Modal reutilizable del panel admin.
 *
 * - Renderiza nada si `isOpen` es false.
 * - Cierra con Escape, click en el fondo o botón X.
 * - Bloquea el scroll del body mientras está abierto.
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdrop = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Diálogo"}
    >
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={handleBackdrop}
      />

      <div
        className={`
          relative
          w-full
          ${SIZES[size]}
          max-h-[90vh]
          overflow-y-auto
          rounded-2xl
          border
          border-gray-200
          bg-white
          shadow-2xl
          dark:border-slate-800
          dark:bg-slate-900
        `}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="px-6 py-5 text-gray-700 dark:text-slate-200">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
