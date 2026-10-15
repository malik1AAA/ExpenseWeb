/**
 * EmptyState - Reusable empty state placeholder
 * Shows when a list or section has no data
 */
function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="p-12 text-center">
      <div className="flex flex-col items-center">
        {Icon && (
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-surface-300" />
          </div>
        )}
        <h3 className="text-lg font-medium text-surface-700 mb-1">
          {title || 'No data yet'}
        </h3>
        {description && (
          <p className="text-surface-400 text-sm max-w-sm mb-4">
            {description}
          </p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

export default EmptyState;
