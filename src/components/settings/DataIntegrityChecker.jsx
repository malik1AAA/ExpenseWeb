import { useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { runIntegrityChecks } from '../../services/integrityCheckerService';
import { useFinance } from '../../hooks/useFinance';

/**
 * DataIntegrityChecker Component
 * Displays data integrity check results
 */
export default function DataIntegrityChecker() {
  const { expenses, debts, debtReturns, categories } = useFinance();
  const [results, setResults] = useState(null);
  const [expandedChecks, setExpandedChecks] = useState(new Set());

  const handleRunChecks = () => {
    const checkResults = runIntegrityChecks(expenses, debts, debtReturns, categories);
    setResults(checkResults);
    setExpandedChecks(new Set());
  };

  const toggleCheck = (checkName) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkName)) {
      newExpanded.delete(checkName);
    } else {
      newExpanded.add(checkName);
    }
    setExpandedChecks(newExpanded);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-surface-50 border-surface-200';
    }
  };

  const renderDetails = (check) => {
    if (!check.details || check.details.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {check.details.map((detail, idx) => (
          <div key={idx} className="bg-white rounded p-3 border border-surface-200 text-sm">
            {renderDetailContent(check.name, detail)}
          </div>
        ))}
      </div>
    );
  };

  const renderDetailContent = (checkName, detail) => {
    switch (checkName) {
      case 'Duplicate ExpenseIDs':
        return (
          <div>
            <span className="font-medium">ID: {detail.id}</span>
            <span className="text-surface-600 ml-2">
              {detail.description} ({detail.date})
            </span>
          </div>
        );
      case 'Duplicate DebtIDs':
        return (
          <div>
            <span className="font-medium">ID: {detail.id}</span>
            <span className="text-surface-600 ml-2">
              {detail.person} ({detail.date})
            </span>
          </div>
        );
      case 'Duplicate ReturnIDs':
        return (
          <div>
            <span className="font-medium">ID: {detail.id}</span>
            <span className="text-surface-600 ml-2">
              Debt: {detail.debtId} ({detail.date})
            </span>
          </div>
        );
      case 'Missing Categories':
        return (
          <div>
            <span className="font-medium">Category: {detail.categoryId}</span>
            <span className="text-surface-600 ml-2">
              {detail.description} ({detail.date})
            </span>
          </div>
        );
      case 'Orphaned Debt Returns':
        return (
          <div>
            <span className="font-medium">Return ID: {detail.returnId}</span>
            <span className="text-surface-600 ml-2">
              References missing debt: {detail.debtId} ({detail.date})
            </span>
          </div>
        );
      case 'Negative Amounts':
        return (
          <div>
            <span className="font-medium">{detail.type}</span>
            <span className="text-surface-600 ml-2">
              {detail.description}: {detail.amount}
            </span>
          </div>
        );
      case 'Invalid Dates':
        return (
          <div>
            <span className="font-medium">{detail.type}</span>
            <span className="text-surface-600 ml-2">
              {detail.description}: {detail.date}
            </span>
          </div>
        );
      case 'Returns Exceeding Debt':
        return (
          <div>
            <span className="font-medium">{detail.person}</span>
            <span className="text-surface-600 ml-2">
              Original: {detail.originalAmount}, Returned: {detail.totalReturned}, 
              Excess: {detail.excess}
            </span>
          </div>
        );
      case 'Invalid Direction Values':
        return (
          <div>
            <span className="font-medium">{detail.person}</span>
            <span className="text-surface-600 ml-2">
              Invalid: "{detail.direction}" (Valid: {detail.validValues})
            </span>
          </div>
        );
      case 'Missing Required Fields':
        return (
          <div>
            <span className="font-medium">{detail.type}</span>
            <span className="text-surface-600 ml-2">
              Missing: {detail.missing.join(', ')}
            </span>
          </div>
        );
      default:
        return <pre className="text-xs">{JSON.stringify(detail, null, 2)}</pre>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-surface-800">
              Data Integrity Checker
            </h3>
            <p className="text-sm text-surface-500">
              Validate your financial data for consistency and accuracy
            </p>
          </div>
        </div>
        <button
          onClick={handleRunChecks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Run Checks
        </button>
      </div>

      {!results ? (
        <div className="text-center py-12 text-surface-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-surface-300" />
          <p>Click "Run Checks" to validate your data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-700">
                {results.summary.passed}
              </div>
              <div className="text-sm text-green-600 font-medium">Passed</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-amber-700">
                {results.summary.warnings}
              </div>
              <div className="text-sm text-amber-600 font-medium">Warnings</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-700">
                {results.summary.errors}
              </div>
              <div className="text-sm text-red-600 font-medium">Errors</div>
            </div>
          </div>

          {/* Check Results */}
          <div className="space-y-3">
            {results.checks.map((check, idx) => (
              <div
                key={idx}
                className={`border rounded-lg overflow-hidden ${getStatusColor(check.status)}`}
              >
                <button
                  onClick={() => toggleCheck(check.name)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div className="text-left">
                      <div className="font-medium text-surface-900">
                        {check.name}
                      </div>
                      <div className="text-sm text-surface-600">
                        {check.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.count > 0 && (
                      <span className="px-2 py-1 bg-white rounded text-sm font-medium">
                        {check.count} issue{check.count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {expandedChecks.has(check.name) ? (
                      <ChevronUp className="w-5 h-5 text-surface-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-600" />
                    )}
                  </div>
                </button>

                {expandedChecks.has(check.name) && check.details && (
                  <div className="px-4 pb-4 border-t border-surface-200">
                    {renderDetails(check)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Overall Status */}
          <div className="mt-6 p-4 rounded-lg bg-surface-50 border border-surface-200">
            <div className="flex items-center gap-3">
              {results.summary.errors > 0 ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-900">
                      Data Integrity Issues Found
                    </div>
                    <div className="text-sm text-red-700">
                      Please fix {results.summary.errors} error{results.summary.errors !== 1 ? 's' : ''} before proceeding
                    </div>
                  </div>
                </>
              ) : results.summary.warnings > 0 ? (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <div className="font-semibold text-amber-900">
                      Data Quality Warnings
                    </div>
                    <div className="text-sm text-amber-700">
                      Found {results.summary.warnings} warning{results.summary.warnings !== 1 ? 's' : ''} - review recommended
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-900">
                      All Checks Passed
                    </div>
                    <div className="text-sm text-green-700">
                      Your data is clean and consistent
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
