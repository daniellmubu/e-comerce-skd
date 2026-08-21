/**
 * Select estilizado reutilizable.
 * - options: [{ value, label }]
 * - placeholder: opción vacía inicial.
 */
function Select({
  id,
  label,
  error,
  options = [],
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-gray-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`
          w-full rounded-xl border bg-white py-3 text-gray-900
          outline-none transition-all duration-300
          focus:ring-4 focus:ring-indigo-500/10
          dark:bg-slate-900 dark:text-white dark:focus:ring-cyan-500/10
          ${
            error
              ? "border-red-500"
              : "border-gray-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-cyan-400"
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default Select;
