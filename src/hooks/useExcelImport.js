import { useState, useCallback } from 'react';
import { readExcelFile, exportToExcel } from '../services/excelService';
import { COLUMNS } from '../config/excelSchema';

/**
 * useExcelImport - Custom hook for Excel import/export operations
 *
 * Handles:
 *   - File selection and validation
 *   - Duplicate detection
 *   - Calling importFinanceData to update context
 *   - Export to Excel
 *   - Loading states and error/warning messages
 */
export function useExcelImport({ onImportSuccess } = {}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);

  /**
   * Handle file selection from input
   * @param {File} file - Selected file
   */
  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    // Clear previous results when a new file is selected
    setImportResult(null);
    setErrors([]);
    setWarnings([]);
  }, []);

  /**
   * Detect duplicate IDs within an array of records
   * @param {Array} records - Array of record objects
   * @param {string} idField - Name of the ID field
   * @returns {{ duplicates: Array, uniqueRecords: Array }}
   */
  const detectDuplicates = (records, idField) => {
    if (!records || records.length === 0) {
      return { duplicates: [], uniqueRecords: [] };
    }

    const seen = new Map();
    const duplicates = [];
    const uniqueRecords = [];

    records.forEach((record) => {
      const id = record[idField];
      if (!id) {
        // Records without IDs are kept (will get new IDs later)
        uniqueRecords.push(record);
        return;
      }

      if (seen.has(id)) {
        duplicates.push(record);
      } else {
        seen.set(id, true);
        uniqueRecords.push(record);
      }
    });

    return { duplicates, uniqueRecords };
  };

  /**
   * Import the selected Excel file
   * @param {Function} importFinanceData - Context function to replace all data
   * @returns {Promise<Object|null>} Import result summary or null on failure
   */
  const handleImport = useCallback(
    async (importFinanceData) => {
      if (!selectedFile) {
        setErrors(['Please select a file first']);
        return null;
      }

      if (!importFinanceData || typeof importFinanceData !== 'function') {
        setErrors(['importFinanceData function is required']);
        return null;
      }

      setIsImporting(true);
      setErrors([]);
      setWarnings([]);
      setImportResult(null);

      try {
        // Read and parse the Excel file
        const result = await readExcelFile(selectedFile);

        // Check for critical errors (e.g., invalid file, missing required sheets)
        if (result.errors && result.errors.length > 0) {
          setErrors(result.errors);
          setIsImporting(false);
          return null;
        }

        // Collect warnings
        const allWarnings = [...(result.warnings || [])];

        // Detect duplicates in each sheet
        const expenseDuplicates = detectDuplicates(
          result.expenses,
          COLUMNS.EXPENSES.EXPENSE_ID
        );
        const debtDuplicates = detectDuplicates(
          result.debts,
          COLUMNS.DEBTS.DEBT_ID
        );
        const returnDuplicates = detectDuplicates(
          result.debtReturns,
          COLUMNS.DEBT_RETURNS.RETURN_ID
        );
        const categoryDuplicates = detectDuplicates(
          result.categories,
          COLUMNS.CATEGORIES.CATEGORY_ID
        );

        // Warn about duplicates
        if (expenseDuplicates.duplicates.length > 0) {
          allWarnings.push(
            `Found ${expenseDuplicates.duplicates.length} duplicate expense(s) that were skipped`
          );
        }
        if (debtDuplicates.duplicates.length > 0) {
          allWarnings.push(
            `Found ${debtDuplicates.duplicates.length} duplicate debt(s) that were skipped`
          );
        }
        if (returnDuplicates.duplicates.length > 0) {
          allWarnings.push(
            `Found ${returnDuplicates.duplicates.length} duplicate debt return(s) that were skipped`
          );
        }
        if (categoryDuplicates.duplicates.length > 0) {
          allWarnings.push(
            `Found ${categoryDuplicates.duplicates.length} duplicate category(ies) that were skipped`
          );
        }

        setWarnings(allWarnings);

        // Check if workbook is effectively empty
        const totalRecords =
          expenseDuplicates.uniqueRecords.length +
          debtDuplicates.uniqueRecords.length +
          returnDuplicates.uniqueRecords.length +
          categoryDuplicates.uniqueRecords.length;

        if (totalRecords === 0) {
          setErrors([
            'The workbook is empty. No records were found in any sheet.',
          ]);
          setIsImporting(false);
          return null;
        }

        // Call the unified import function with all data at once
        importFinanceData({
          expenses: expenseDuplicates.uniqueRecords,
          debts: debtDuplicates.uniqueRecords,
          debtReturns: returnDuplicates.uniqueRecords,
          categories: categoryDuplicates.uniqueRecords,
          fileName: selectedFile.name,
        });

        // Build the result summary
        const summary = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          expenses: expenseDuplicates.uniqueRecords.length,
          debts: debtDuplicates.uniqueRecords.length,
          debtReturns: returnDuplicates.uniqueRecords.length,
          categories: categoryDuplicates.uniqueRecords.length,
          skippedDuplicates:
            expenseDuplicates.duplicates.length +
            debtDuplicates.duplicates.length +
            returnDuplicates.duplicates.length +
            categoryDuplicates.duplicates.length,
        };

        setImportResult(summary);

        // Notify parent of successful import
        if (onImportSuccess) {
          onImportSuccess(summary);
        }

        setIsImporting(false);
        return summary;
      } catch (error) {
        setErrors([`Import failed: ${error.message || 'Unknown error'}`]);
        setIsImporting(false);
        return null;
      }
    },
    [selectedFile, onImportSuccess]
  );

  /**
   * Export current data to Excel file
   * @param {Object} data - Data to export (expenses, debts, debtReturns, categories)
   * @param {string} filename - Output filename (without extension)
   * @returns {Promise<boolean>} True if export succeeded
   */
  const handleExport = useCallback(async (data, filename = 'finance-data') => {
    setIsExporting(true);
    setErrors([]);
    setWarnings([]);

    try {
      // Validate that we have something to export
      const hasData =
        (data.expenses && data.expenses.length > 0) ||
        (data.debts && data.debts.length > 0) ||
        (data.debtReturns && data.debtReturns.length > 0) ||
        (data.categories && data.categories.length > 0);

      if (!hasData) {
        setWarnings([
          'No data to export. The workbook will be created with empty sheets.',
        ]);
      }

      const success = exportToExcel(data, filename);

      if (!success) {
        setErrors(['Failed to export Excel file. Please try again.']);
        setIsExporting(false);
        return false;
      }

      setIsExporting(false);
      return true;
    } catch (error) {
      setErrors([`Export failed: ${error.message || 'Unknown error'}`]);
      setIsExporting(false);
      return false;
    }
  }, []);

  /**
   * Reset all state (clear file selection and results)
   */
  const reset = useCallback(() => {
    setSelectedFile(null);
    setImportResult(null);
    setErrors([]);
    setWarnings([]);
  }, []);

  return {
    selectedFile,
    isImporting,
    isExporting,
    importResult,
    errors,
    warnings,
    handleFileSelect,
    handleImport,
    handleExport,
    reset,
  };
}
