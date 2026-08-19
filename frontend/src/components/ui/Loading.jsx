import React from "react";

const SIZES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

function Loading({ size = "md", fullScreen = false, label }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <span
        className={`
          ${SIZES[size]}
          animate-spin rounded-full
          border-indigo-200 border-t-indigo-600 dark:border-cyan-500/30 dark:border-t-cyan-400
        `}
      />
      {label && <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-gray-50 dark:bg-slate-950">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default Loading;