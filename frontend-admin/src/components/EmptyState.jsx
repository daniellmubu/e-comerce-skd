function EmptyState({ icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center dark:border-slate-700">
      {icon && (
        <div className="mb-4 text-4xl text-gray-400 dark:text-slate-600">
          {icon}
        </div>
      )}
      {title && (
        <p className="font-medium text-gray-700 dark:text-slate-200">{title}</p>
      )}
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export default EmptyState;
