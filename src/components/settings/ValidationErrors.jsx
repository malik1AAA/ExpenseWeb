import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

/**
 * ValidationErrors Component
 * Displays validation errors and warnings in a user-friendly format
 */
export default function ValidationErrors({ validationFormatted, onClose }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!validationFormatted) {
    return null;
  }

  const { summary, errors, warnings } = validationFormatted;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">
              Validation Errors
            </h3>
            <p className="text-xs text-red-700 mt-1">{summary}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-red-700 hover:text-red-900 font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-600 hover:text-red-800"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Errors */}
          {errors && errors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-800 mb-2 uppercase tracking-wide">
                Errors ({errors.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errors.map((error, index) => (
                  <div
                    key={index}
                    className="bg-white border border-red-200 rounded p-2 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-red-700 min-w-[80px]">
                        {error.sheet}
                      </span>
                      <div className="flex-1">
                        <div className="text-surface-600">
                          <span className="font-medium">{error.location}</span>
                          {error.field && (
                            <span className="text-surface-500">
                              {' '}
                              - {error.field}
                            </span>
                          )}
                        </div>
                        <div className="text-red-800 mt-1">{error.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings && warnings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Warnings ({warnings.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-amber-50 border border-amber-200 rounded p-2 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-amber-700 min-w-[80px]">
                        {warning.sheet}
                      </span>
                      <div className="flex-1">
                        <div className="text-surface-600">
                          <span className="font-medium">{warning.location}</span>
                          {warning.field && (
                            <span className="text-surface-500">
                              {' '}
                              - {warning.field}
                            </span>
                          )}
                        </div>
                        <div className="text-amber-800 mt-1">
                          {warning.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
