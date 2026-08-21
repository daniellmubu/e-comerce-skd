function Input({
  id,
  label,
  error,
  icon,
  type = "text",
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

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={type}
          className={`
            w-full rounded-xl border bg-white py-3 text-gray-900
            placeholder-gray-400 outline-none transition-all duration-300
            focus:ring-4 focus:ring-indigo-500/10
            dark:bg-slate-900 dark:text-white dark:placeholder-slate-500
            dark:focus:ring-cyan-500/10
            ${icon ? "pl-11" : "pl-4"} pr-4
            ${
              error
                ? "border-red-500"
                : "border-gray-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-cyan-400"
            }
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export default Input;
