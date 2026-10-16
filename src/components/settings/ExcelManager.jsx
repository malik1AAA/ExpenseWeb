import { useRef, useState, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Eye, Shield } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { useExcelImport } from '../../hooks/useExcelImport';
import ValidationErrors from './ValidationErrors';

/**
 * ExcelManager Component
 * Handles Excel file import and export functionality with clear separation
 */
export default function ExcelManager() {
  const fileInputRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
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
      setPreviewData(null);
    }
  };

  /**
   * Trigger file input click
   */
  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle validate button click - show preview
   */
  const handleValidateClick = async () => {
    if (!selectedFile) return;
    
    // Perform validation without importing
    const result = await handleImport(null, true); // validate only
    if (result && result.validation && result.validation.isValid) {
      setPreviewData(result);
      setShowPreview(true);
    }
  };

  /**
   * Handle preview import button click
   */
  const handlePreviewImportClick = () => {
    setShowPreview(false);
    setShowConfirmDialog(true);
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
    setShowPreview(false);
  };

  /**
   * Handle export current data
   */
  const handleExportCurrentClick = async () => {
    const data = {
      expenses,
      debts,
      debtReturns,
      categories,
    };
    await handleExport(data);
  };

  /**
   * Handle export backup (same as current but with backup suffix)
   */
  const handleExportBackupClick = async () => {
    const data = {
      expenses,
      debts,
      debtReturns,
      categories,
    };
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    await handleExport(data, `PersonalFinance_Backup_${timestamp}`);
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    reset();
    setPreviewData(null);
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
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm"
        onChange={onFileChange}
        className="hidden"
      />

      {/* ============================================ */}
      {/* SECTION 1: IMPORT DATA */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {/* Section Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                IMPORT DATA
              </h3>
              <p className="text-sm text-blue-700">
                Import data from an Excel file
              </p>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Choose File */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Step 1: Choose Excel File
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleChooseFile}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
              {selectedFile && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 flex items-center gap-2 p-2 bg-surface-50 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4 text-surface-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-surface-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="p-1.5 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg transition-colors"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Validate */}
          {selectedFile && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Step 2: Validate
              </label>
              <button
                onClick={handleValidateClick}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-surface-700 border-t-transparent rounded-full animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Validate File
                  </>
                )}
              </button>
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
                    Validation Failed
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

          {/* Import Result */}
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
        </div>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: EXPORT / BACKUP */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {/* Section Header */}
        <div className="bg-green-50 border-b border-green-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                EXPORT / BACKUP
              </h3>
              <p className="text-sm text-green-700">
                Export your data to Excel
              </p>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportCurrentClick}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-surface-700 border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Current Excel
                </>
              )}
            </button>

            <button
              onClick={handleExportBackupClick}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-surface-700 border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Backup
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-surface-500">
            Files are automatically named with the current date (e.g., PersonalFinance_2026-01-29.xlsx)
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* PREVIEW MODAL */}
      {/* ============================================ */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-surface-900">
                  Preview Import
                </h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">File:</span> {previewData.fileName}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {formatFileSize(previewData.fileSize)}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-surface-900">
                  Data Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-surface-50 rounded-lg">
                    <p className="text-xs text-surface-600 mb-1">Expenses</p>
                    <p className="text-2xl font-bold text-surface-900">
                      {previewData.expenses}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg">
                    <p className="text-xs text-surface-600 mb-1">Debts</p>
                    <p className="text-2xl font-bold text-surface-900">
                      {previewData.debts}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg">
                    <p className="text-xs text-surface-600 mb-1">Debt Returns</p>
                    <p className="text-2xl font-bold text-surface-900">
                      {previewData.debtReturns}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-50 rounded-lg">
                    <p className="text-xs text-surface-600 mb-1">Categories</p>
                    <p className="text-2xl font-bold text-surface-900">
                      {previewData.categories}
                    </p>
                  </div>
                </div>
              </div>

              {previewData.skippedDuplicates > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <span className="font-medium">Note:</span>{' '}
                    {previewData.skippedDuplicates} duplicate record{previewData.skippedDuplicates !== 1 ? 's' : ''} will be skipped
                  </p>
                </div>
              )}

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Warning: Data Replacement
                    </p>
                    <p className="text-sm text-red-800">
                      This will <strong>replace all current data</strong> in the application. 
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-surface-200 bg-surface-50">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePreviewImportClick}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue to Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CONFIRMATION DIALOG */}
      {/* ============================================ */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  Confirm Data Replacement
                </h3>
                <p className="text-sm text-surface-600 mb-3">
                  You are about to <strong className="text-red-600">replace all existing data</strong> in the application with data from:
                </p>
                <div className="p-3 bg-surface-50 rounded-lg mb-3">
                  <p className="text-sm font-medium text-surface-900">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-surface-500">
                    {selectedFile && formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ This action cannot be undone.</strong>
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Make sure you have a backup before proceeding.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelImport}
                className="flex-1 px-4 py-2 text-sm font-medium text-surface-700 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Replace Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
