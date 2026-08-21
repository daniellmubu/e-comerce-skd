/**
 * Switch (toggle) reutilizable.
 * - checked: boolean
 * - onChange: recibe el nuevo valor
 */
function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        {label && (
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
            {label}
          </p>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative h-6 w-11 shrink-0 rounded-full transition
          ${checked ? "bg-indigo-600 dark:bg-cyan-500" : "bg-gray-300 dark:bg-slate-700"}
        `}
      >
        <span
          className={`
            absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

export default Toggle;
