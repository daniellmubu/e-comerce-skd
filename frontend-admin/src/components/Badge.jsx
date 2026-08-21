const VARIANTS = {
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  slate: "border-slate-700 bg-slate-800 text-slate-300",
};

function Badge({ children, variant = "cyan", className = "", ...props }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full border
        px-3 py-1
        text-xs font-medium
        ${VARIANTS[variant] || VARIANTS.cyan}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
