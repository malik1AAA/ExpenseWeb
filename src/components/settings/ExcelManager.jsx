import { useRef, useState, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { useExcelImport } from '../../hooks/useExcelImport';
import ValidationErrors from './ValidationErrors';

/**
 * ExcelManager Component
 * Handles Excel file import and export functionality
 */
export default function ExcelManager() {
  const fileInputRef = useRef(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);
  
  const {
    expenses,
    debts,
    debtReturns,
    categories,
    importFinanceData,
  } = useFinance();

  const {
    selectedFile,
    isImporting,
    isExporting,
    importResult,
    errors,
    warnings,
    validationFormatted,
    handleFileSelect,
    handleImport,
    handleExport,
    reset,
  } = useExcelImport();

  // Update local validation errors state when validationFormatted changes
  useEffect(() => {
    if (validationFormatted) {
      setValidationErrors(validationFormatted);
    }
  }, [validationFormatted]);

  /**
   * Handle file input change
   */
  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle import button click - show confirmation dialog
   */
  const handleImportClick = () => {
    if (selectedFile) {
      setShowConfirmDialog(true);
    }
  };

  /**
   * Confirm import - replace all existing data
   */
  const confirmImport = async () => {
    setShowConfirmDialog(false);
    await handleImport(importFinanceData);
  };

  /**
   * Cancel import
   */
  const cancelImport = () => {
    setShowConfirmDialog(false);
  };

  /**
   * Handle export button click
   */
  const handleExportClick = async () => {
    const data = {
      expenses,
      debts,
      debtReturns,
      categories,
    };

    // Use auto-generated filename with date
    await handleExport(data);
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-green-50">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-surface-800">
            Excel Data Management
          </h3>
          <p className="text-sm text-surface-500">
            Import and export your finance data
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={onFileChange}
        className="hidden"
      />

      {/* File selection and import */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleChooseFile}
            disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Choose Excel File
          </button>

          {selectedFile && (
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Import Excel
                </>
              )}
            </button>
          )}

          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-surface-700 border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Excel
              </>
            )}
          </button>
        </div>

        {/* Selected file info */}
        {selectedFile && !importResult && (
          <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-primary-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-primary-600">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearFile}
              className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Import result summary */}
        {importResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 mb-2">
                  Import Successful
                </h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p>
                    <span className="font-medium">File:</span> {importResult.fileName}
                  </p>
                  <p>
                    <span className="font-medium">Expenses:</span>{' '}
                    {importResult.expenses} record{importResult.expenses !== 1 ? 's' : ''}
                  </p>
                  <p>
                    <span className="font-medium">Debts:</span>{' '}
                    {importResult.debts} record{importResult.debts !== 1 ? 's' : ''}
                  </p>
                  <p>
                    <span className="font-medium">Debt Returns:</span>{' '}
                    {importResult.debtReturns} record{importResult.debtReturns !== 1 ? 's' : ''}
                  </p>
                  <p>
                    <span className="font-medium">Categories:</span>{' '}
                    {importResult.categories} record{importResult.categories !== 1 ? 's' : ''}
                  </p>
                  {importResult.skippedDuplicates > 0 && (
                    <p className="text-amber-700">
                      <span className="font-medium">Skipped:</span>{' '}
                      {importResult.skippedDuplicates} duplicate{importResult.skippedDuplicates !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors && (
          <ValidationErrors
            validationFormatted={validationErrors}
            onClose={() => setValidationErrors(null)}
          />
        )}

        {/* Errors */}
        {errors.length > 0 && !validationFormatted && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-900 mb-2">
                  Import Failed
                </h4>
                <ul className="space-y-1 text-sm text-red-800">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                  Warnings
                </h4>
                <ul className="space-y-1 text-sm text-amber-800">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  Replace Existing Data?
                </h3>
                <p className="text-sm text-surface-600">
                  Importing this file will <strong>replace all existing data</strong> in your application. 
                  This action cannot be undone.
                </p>
                <p className="text-sm text-surface-600 mt-2">
                  Make sure you have a backup if you want to keep your current data.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelImport}
                className="px-4 py-2 text-sm font-medium text-surface-700 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Replace Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
