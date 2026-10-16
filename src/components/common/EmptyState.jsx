import { AlertCircle } from 'lucide-react';

/**
 * EmptyState - Component for displaying empty states with icon and message
 */
export default function EmptyState({ 
  icon: Icon = AlertCircle,
  title, 
  description, 
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-400" />
      </div>
      {title && (
        <h3 className="text-lg font-semibold text-surface-900 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-surface-500 max-w-md mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
