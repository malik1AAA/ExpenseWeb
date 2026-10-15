/**
 * Textarea - Reusable textarea component
 */
export default function Textarea({ 
  label, 
  error, 
  className = '',
  ...props 
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={3}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
          error ? 'border-red-500' : 'border-surface-200'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
