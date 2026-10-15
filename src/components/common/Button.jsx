/**
 * Button - Reusable button component with variants
 */
function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon, 
  className = '', 
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm',
    secondary: 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 focus:ring-primary-500',
    ghost: 'text-surface-600 hover:bg-surface-100 focus:ring-primary-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button className={classes} {...props}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

export default Button;
