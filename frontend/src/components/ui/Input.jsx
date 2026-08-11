import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Input({
  id,
  label,
  error,
  icon,
  type = "text",
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}

        <input
          id={id}
          type={inputType}
          className={`
            w-full
            rounded-xl
            border
            bg-slate-900
            py-3
            text-white
            placeholder-slate-500
            outline-none
            transition-all
            duration-300
            focus:ring-4
            focus:ring-cyan-500/10
            ${icon ? "pl-11" : "pl-4"}
            ${type === "password" ? "pr-12" : "pr-4"}
            ${error ? "border-red-500" : "border-slate-700 focus:border-cyan-400"}
            ${className}
          `}
          {...props}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export default Input;