/**
 * Card - Reusable card container with optional header
 */
function Card({ title, icon: Icon, children, className = '', headerAction }) {
  return (
    <div className={`bg-white rounded-xl border border-surface-200 ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-surface-50">
                <Icon className="w-5 h-5 text-surface-600" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-surface-800">{title}</h3>
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export default Card;
