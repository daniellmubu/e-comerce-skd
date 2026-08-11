import React from "react";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:shadow-[0_0_25px_rgba(34,211,238,0.35)]",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-700",
  outline:
    "border border-slate-700 bg-transparent text-slate-300 hover:border-cyan-400 hover:text-cyan-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700",
  ghost:
    "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
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
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        font-semibold
        transition-all
        duration-300
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-60
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