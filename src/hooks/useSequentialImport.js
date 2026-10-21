/**
 * useSequentialImport Hook
 * Manages the sequential import pipeline with staging, progress tracking,
 * and error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { readExcelFile } from '../services/excelService';
import { importQueue, IMPORT_STATUS } from '../services/importQueueService';
import { useAuth } from '../context/AuthContext';

/**
 * Sequential import hook
 * @returns {Object} Import state and methods
 */
export function useSequentialImport() {
  const { user } = useAuth();
  const [status, setStatus] = useState(IMPORT_STATUS.IDLE);
  const [progress, setProgress] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentTable: '',
    currentRecord: 0,
  });
  const [errors, setErrors] = useState([]);
  const [stagedSummary, setStagedSummary] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Ref to prevent duplicate imports
  const importInProgressRef = useRef(false);
  const importJobIdRef = useRef(null);

  // Set up progress callback
  useEffect(() => {
    importQueue.setProgressCallback((update) => {
      setStatus(update.status);
      setProgress(update.progress);
      setErrors(update.errors);
    });

    return () => {
      importQueue.setProgressCallback(null);
    };
  }, []);

  /**
   * Stage a file for import (parse and validate)
   * @param {File} file - Excel file to import
   * @returns {Promise<Object>} Staging result
   */
  const stageFile = useCallback(async (file) => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setSelectedFile(file);
    setStatus(IMPORT_STATUS.STAGING);
    setErrors([]);
    setStagedSummary(null);

    try {
      // Parse Excel file
      const parsedData = await readExcelFile(file);

      if (parsedData.errors && parsedData.errors.length > 0) {
        setStatus(IMPORT_STATUS.FAILED);
        setErrors(parsedData.errors.map(err => ({
          stage: 'parsing',
          message: err,
        })));
        return {
          success: false,
          error: 'File parsing failed',
          errors: parsedData.errors,
        };
      }

      // Stage the parsed data
      const result = await importQueue.stageData(parsedData);

      if (result.success) {
        setStagedSummary(result.summary);
        setStatus(IMPORT_STATUS.READY);
        return {
          success: true,
          summary: result.summary,
        };
      } else {
        setStatus(IMPORT_STATUS.FAILED);
        setErrors([{ stage: 'staging', message: result.error }]);
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      setStatus(IMPORT_STATUS.FAILED);
      setErrors([{ stage: 'staging', message: error.message }]);
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  /**
   * Execute the import
   * @param {string} mode - 'replace' or 'merge'
   * @returns {Promise<Object>} Import result
   */
  const executeImport = useCallback(async (mode = 'merge') => {
    // Prevent duplicate imports
    if (importInProgressRef.current) {
      return {
        success: false,
        error: 'Import already in progress',
      };
    }

    if (status !== IMPORT_STATUS.READY) {
      return {
        success: false,
        error: 'Import queue is not ready. Stage a file first.',
      };
    }

    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    importInProgressRef.current = true;
    importJobIdRef.current = `import_${Date.now()}`;

    try {
      const result = await importQueue.executeImport(mode);

      importInProgressRef.current = false;
      importJobIdRef.current = null;

      return result;
    } catch (error) {
      importInProgressRef.current = false;
      importJobIdRef.current = null;

      return {
        success: false,
        error: error.message,
      };
    }
  }, [status, user]);

  /**
   * Cancel the import
   */
  const cancelImport = useCallback(() => {
    if (status === IMPORT_STATUS.IMPORTING) {
      importQueue.cancel();
    }
  }, [status]);

  /**
   * Reset the import state
   */
  const resetImport = useCallback(() => {
    importQueue.reset();
    setStatus(IMPORT_STATUS.IDLE);
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentTable: '',
      currentRecord: 0,
    });
    setErrors([]);
    setStagedSummary(null);
    setSelectedFile(null);
    importInProgressRef.current = false;
    importJobIdRef.current = null;
  }, []);

  /**
   * Get import status text
   */
  const getStatusText = useCallback(() => {
    switch (status) {
      case IMPORT_STATUS.IDLE:
        return 'Ready to import';
      case IMPORT_STATUS.STAGING:
        return 'Parsing file...';
      case IMPORT_STATUS.READY:
        return 'Ready to import';
      case IMPORT_STATUS.IMPORTING:
        return `Importing... (${progress.processed}/${progress.total})`;
      case IMPORT_STATUS.COMPLETED:
        return 'Import completed successfully';
      case IMPORT_STATUS.COMPLETED_WITH_ERRORS:
        return `Import completed with ${progress.failed} error(s)`;
      case IMPORT_STATUS.FAILED:
        return 'Import failed';
      case IMPORT_STATUS.CANCELLED:
        return 'Import cancelled';
      default:
        return '';
    }
  }, [status, progress]);

  /**
   * Get progress percentage
   */
  const getProgressPercentage = useCallback(() => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  }, [progress]);

  return {
    // State
    status,
    progress,
    errors,
    stagedSummary,
    selectedFile,
    
    // Methods
    stageFile,
    executeImport,
    cancelImport,
    resetImport,
    
    // Helpers
    getStatusText,
    getProgressPercentage,
    
    // Constants
    IMPORT_STATUS,
  };
}
