const VARIANTS = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-violet-600 dark:hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]",
  secondary:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
  outline:
    "border border-gray-200 bg-transparent text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-400 dark:hover:text-cyan-400",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
};

const SIZES = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl font-semibold transition-all duration-300 active:scale-95
        disabled:cursor-not-allowed disabled:opacity-60
        ${SIZES[size]}
        ${VARIANTS[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}

export default Button;
