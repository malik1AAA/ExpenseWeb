/**
 * Card - Reusable card container with optional header
 * Supports hover effects and customizable padding
 */
function Card({ 
  title, 
  icon: Icon, 
  children, 
  className = '', 
  headerAction,
  hoverable = false,
  padding = 'md'
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={`
        bg-white rounded-xl border border-surface-200 
        ${hoverable ? 'hover:shadow-lg hover:border-surface-300 transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
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
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}

export default Card;
