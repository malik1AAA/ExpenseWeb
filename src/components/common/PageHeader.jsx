/**
 * PageHeader - Reusable page header with title, description, and actions
 */
function PageHeader({ title, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">{title}</h2>
        {description && (
          <p className="text-surface-500 mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
