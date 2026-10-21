/**
 * SequentialImportManager Component
 * Provides a UI for the sequential import pipeline with staging,
 * progress tracking, and error handling
 */

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Play, Square, RotateCcw } from 'lucide-react';
import { useSequentialImport } from '../../hooks/useSequentialImport';
import { useFinance } from '../../hooks/useFinance';
import { Button } from '../common';

export default function SequentialImportManager() {
  const { refreshData } = useFinance();
  const {
    status,
    progress,
    errors,
    stagedSummary,
    selectedFile,
    stageFile,
    executeImport,
    cancelImport,
    resetImport,
    getStatusText,
    getProgressPercentage,
    IMPORT_STATUS,
  } = useSequentialImport();

  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('merge');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset any previous import
    resetImport();

    // Stage the file
    await stageFile(file);
  };

  /**
   * Handle import button click
   */
  const handleImportClick = () => {
    if (status === IMPORT_STATUS.READY) {
      setShowConfirmDialog(true);
    }
  };

  /**
   * Confirm and execute import
   */
  const handleConfirmImport = async () => {
    setShowConfirmDialog(false);

    const result = await executeImport(importMode);

    if (result.success) {
      // Refresh data after successful import
      await refreshData();
    }
  };

  /**
   * Handle cancel import
   */
  const handleCancelImport = () => {
    cancelImport();
  };

  /**
   * Handle reset
   */
  const handleReset = () => {
    resetImport();
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

  const isImporting = status === IMPORT_STATUS.IMPORTING;
  const isReady = status === IMPORT_STATUS.READY;
  const isCompleted = status === IMPORT_STATUS.COMPLETED || status === IMPORT_STATUS.COMPLETED_WITH_ERRORS;
  const isFailed = status === IMPORT_STATUS.FAILED;

  return (
    <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Excel Import
          </h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">
            Import expenses, debts, categories, and debt returns from Excel
          </p>
        </div>
        {selectedFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isImporting}
            icon={RotateCcw}
          >
            Reset
          </Button>
        )}
      </div>

      {/* File Selection */}
      {!selectedFile && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-file-input"
            disabled={isImporting}
          />
          <label
            htmlFor="excel-file-input"
            className={`
              flex flex-col items-center justify-center w-full h-32
              border-2 border-dashed rounded-lg cursor-pointer
              transition-colors
              ${isImporting
                ? 'border-surface-300 bg-surface-50 cursor-not-allowed'
                : 'border-surface-300 hover:border-primary-500 hover:bg-primary-50'
              }
            `}
          >
            <Upload className="w-8 h-8 text-surface-400 mb-2" />
            <span className="text-sm text-surface-600">
              {isImporting ? 'Import in progress...' : 'Click to select Excel file'}
            </span>
            <span className="text-xs text-surface-500 mt-1">
              Supports .xlsx and .xls files
            </span>
          </label>
        </div>
      )}

      {/* File Info and Staging Summary */}
      {selectedFile && stagedSummary && (
        <div className="mb-6 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-surface-600 dark:text-surface-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isImporting}
              className="text-surface-400 hover:text-surface-600 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-surface-600 dark:text-surface-400">Categories:</span>
              <span className="ml-2 font-medium text-surface-900 dark:text-surface-100">
                {stagedSummary.categories}
              </span>
            </div>
            <div>
              <span className="text-surface-600 dark:text-surface-400">Expenses:</span>
              <span className="ml-2 font-medium text-surface-900 dark:text-surface-100">
                {stagedSummary.expenses}
              </span>
            </div>
            <div>
              <span className="text-surface-600 dark:text-surface-400">Debts:</span>
              <span className="ml-2 font-medium text-surface-900 dark:text-surface-100">
                {stagedSummary.debts}
              </span>
            </div>
            <div>
              <span className="text-surface-600 dark:text-surface-400">Debt Returns:</span>
              <span className="ml-2 font-medium text-surface-900 dark:text-surface-100">
                {stagedSummary.debtReturns}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              Total Records: {stagedSummary.total}
            </p>
          </div>
        </div>
      )}

      {/* Import Mode Selection */}
      {isReady && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Import Mode
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="merge"
                checked={importMode === 'merge'}
                onChange={(e) => setImportMode(e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Merge (add to existing data)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="replace"
                checked={importMode === 'replace'}
                onChange={(e) => setImportMode(e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">
                Replace (delete existing data)
              </span>
            </label>
          </div>
          {importMode === 'replace' && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠️ Warning: This will delete all existing data before importing
            </p>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {isImporting && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {getStatusText()}
            </span>
            <span className="text-sm text-surface-600 dark:text-surface-400">
              {getProgressPercentage()}%
            </span>
          </div>
          <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          {progress.currentTable && (
            <p className="mt-2 text-xs text-surface-600 dark:text-surface-400">
              Processing {progress.currentTable} ({progress.currentRecord})
            </p>
          )}
        </div>
      )}

      {/* Completion Summary */}
      {isCompleted && (
        <div className={`mb-6 p-4 rounded-lg ${
          status === IMPORT_STATUS.COMPLETED
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-start gap-3">
            {status === IMPORT_STATUS.COMPLETED ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                status === IMPORT_STATUS.COMPLETED
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-amber-900 dark:text-amber-100'
              }`}>
                {getStatusText()}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-surface-600 dark:text-surface-400">Total:</span>
                  <span className="ml-2 font-medium text-surface-900 dark:text-surface-100">
                    {progress.total}
                  </span>
                </div>
                <div>
                  <span className="text-green-600 dark:text-green-400">Success:</span>
                  <span className="ml-2 font-medium text-green-900 dark:text-green-100">
                    {progress.successful}
                  </span>
                </div>
                <div>
                  <span className="text-red-600 dark:text-red-400">Failed:</span>
                  <span className="ml-2 font-medium text-red-900 dark:text-red-100">
                    {progress.failed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                {errors.length} error(s) occurred during import
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-xs text-red-800 dark:text-red-200">
                    {error.table && (
                      <span className="font-medium">[{error.table}] </span>
                    )}
                    {error.record && (
                      <span>Record {error.record}: </span>
                    )}
                    {error.message}
                  </div>
                ))}
                {errors.length > 10 && (
                  <p className="text-xs text-red-700 dark:text-red-300 italic">
                    ... and {errors.length - 10} more error(s)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isReady && (
          <Button
            variant="primary"
            onClick={handleImportClick}
            icon={Play}
            className="flex-1"
          >
            Start Import
          </Button>
        )}

        {isImporting && (
          <Button
            variant="danger"
            onClick={handleCancelImport}
            icon={Square}
            className="flex-1"
          >
            Cancel Import
          </Button>
        )}

        {(isCompleted || isFailed) && (
          <Button
            variant="primary"
            onClick={handleReset}
            icon={RotateCcw}
            className="flex-1"
          >
            Import Another File
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  Confirm Import
                </h3>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                  You are about to import {stagedSummary?.total || 0} records:
                </p>
                <ul className="text-sm text-surface-700 dark:text-surface-300 space-y-1 mb-3">
                  <li>• {stagedSummary?.categories || 0} categories</li>
                  <li>• {stagedSummary?.expenses || 0} expenses</li>
                  <li>• {stagedSummary?.debts || 0} debts</li>
                  <li>• {stagedSummary?.debtReturns || 0} debt returns</li>
                </ul>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Mode: <span className="font-medium">{importMode === 'merge' ? 'Merge' : 'Replace'}</span>
                </p>
                {importMode === 'replace' && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ This will delete all existing data before importing
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmImport}
                className="flex-1"
              >
                Confirm Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
