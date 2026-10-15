import * as XLSX from 'xlsx';

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
 * Export data to Excel file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Sheet name (default: 'Sheet1')
 */
export const exportToExcel = (data, filename = 'finance-data', sheetName = 'Sheet1') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export Excel file:', error);
    return false;
  }
};

/**
 * Read multiple sheets from an Excel file
 * @param {File} file - File object
 * @returns {Promise<Object>} Object with sheet names as keys and data arrays as values
 */
export const readExcelSheets = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheets = {};
        workbook.SheetNames.forEach(name => {
          sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' });
        });
        
        resolve(sheets);
      } catch (error) {
        reject(new Error(`Failed to read Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
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
 * Validate Excel data structure
 * @param {Array} data - Data to validate
 * @param {string[]} requiredColumns - Required column names
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateExcelData = (data, requiredColumns = []) => {
  const errors = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }
  
  if (data.length === 0) {
    errors.push('Data is empty');
    return { valid: false, errors };
  }
  
  const columns = Object.keys(data[0]);
  
  requiredColumns.forEach(col => {
    if (!columns.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};
