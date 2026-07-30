import React from "react";

function Card({ children, className = "", hoverEffect = true, ...props }) {
  return (
    <div
      className={`
        rounded-3xl
        border border-slate-800
        bg-slate-900
        p-6
        transition-all duration-500
        ${
          hoverEffect
            ? "hover:-translate-y-2 hover:border-cyan-500 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]"
            : ""
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;