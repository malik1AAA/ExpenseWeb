import * as XLSX from 'xlsx';
import { SHEET_NAMES, SHEET_COLUMNS, getRequiredColumns } from '../config/excelSchema';

/**
 * Excel Service - Handles reading and writing Excel files
 * Uses SheetJS (xlsx) library for Excel operations
 */

/**
 * Read an Excel file and return data as JSON
 * @param {File} file - File object from input
 * @param {string} sheetName - Optional sheet name (defaults to first sheet)
 * @returns {Promise<Array>} Array of row objects
 */
export const readExcelFile = async (file, sheetName = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheet = sheetName 
          ? workbook.Sheets[sheetName] 
          : workbook.Sheets[workbook.SheetNames[0]];
        
        if (!sheet) {
          reject(new Error('Sheet not found'));
          return;
        }
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { 
          defval: '',
          raw: false 
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Read all sheets from the finance workbook
 * @param {File} file - File object
 * @returns {Promise<Object>} Object with sheet data keyed by sheet name
 */
export const readFinanceWorkbook = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result = {};
        
        // Read each expected sheet
        Object.values(SHEET_NAMES).forEach(sheetName => {
          if (workbook.Sheets[sheetName]) {
            result[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { 
              defval: '',
              raw: false 
            });
          } else {
            result[sheetName] = [];
          }
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Export data to Excel file
 * @param {Object} data - Object with sheet names as keys and data arrays as values
 * @param {string} filename - Output filename (without extension)
 */
export const exportToExcel = (data, filename = 'finance-data') => {
  try {
    const workbook = XLSX.utils.book_new();
    
    Object.entries(data).forEach(([sheetName, sheetData]) => {
      if (sheetData && sheetData.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // Auto-size columns based on defined schema
        const columns = SHEET_COLUMNS[sheetName];
        if (columns) {
          const colWidths = columns.map(col => ({
            wch: Math.max(col.length, ...sheetData.map(row => String(row[col] || '').length)) + 2
          }));
          worksheet['!cols'] = colWidths;
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export Excel file:', error);
    return false;
  }
};

/**
 * Get sheet names from an Excel file
 * @param {File} file - File object
 * @returns {Promise<string[]>} Array of sheet names
 */
export const getSheetNames = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Validate Excel data structure for a specific sheet
 * @param {Array} data - Data to validate
 * @param {string} sheetName - Sheet name to validate against
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateSheetData = (data, sheetName) => {
  const errors = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('Data is empty');
    return { valid: false, errors };
  }
  
  const requiredColumns = getRequiredColumns(sheetName);
  const columns = Object.keys(data[0]);
  
  requiredColumns.forEach(col => {
    if (!columns.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};

/**
 * Create an empty workbook template with all required sheets and headers
 * @returns {Object} XLSX workbook object
 */
export const createEmptyTemplate = () => {
  const workbook = XLSX.utils.book_new();
  
  Object.entries(SHEET_COLUMNS).forEach(([sheetName, columns]) => {
    // Create header row
    const headerRow = {};
    columns.forEach(col => {
      headerRow[col] = col;
    });
    
    const worksheet = XLSX.utils.json_to_sheet([headerRow]);
    
    // Auto-size columns
    const colWidths = columns.map(col => ({ wch: col.length + 4 }));
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  
  return workbook;
};

/**
 * Download an empty template Excel file
 * @param {string} filename - Output filename
 */
export const downloadTemplate = (filename = 'finance-template') => {
  const workbook = createEmptyTemplate();
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
