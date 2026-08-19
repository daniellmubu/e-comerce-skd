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
          className="mb-2 block text-sm font-medium text-gray-600 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
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
            bg-white
            dark:bg-slate-900
            py-3
            text-gray-900
            dark:text-white
            placeholder-gray-400
            dark:placeholder-slate-500
            outline-none
            transition-all
            duration-300
            focus:ring-4
            focus:ring-indigo-500/10
            dark:focus:ring-cyan-500/10
            ${icon ? "pl-11" : "pl-4"}
            ${type === "password" ? "pr-12" : "pr-4"}
            ${error ? "border-red-500" : "border-gray-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-cyan-400"}
            ${className}
          `}
          {...props}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-cyan-400 transition"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

export default Input;
