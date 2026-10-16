import * as XLSX from 'xlsx';
import { 
  SHEET_NAMES, 
  COLUMNS, 
  SHEET_COLUMNS,
  DEBT_DIRECTION,
  DEBT_CATEGORY,
  CATEGORY_TYPE
} from '../config/excelSchema';
import { validateImportedData, formatValidationErrors } from './validationService';

/**
 * Excel Service - Handles reading, parsing, creating, and exporting Excel files
 * Uses SheetJS (xlsx) library for Excel operations
 * 
 * This service is purely data-focused with no UI code.
 */

// ============================================================================
// COLUMN NORMALIZATION
// ============================================================================

/**
 * Normalize a column name for comparison
 * Removes spaces, underscores, hyphens and converts to lowercase
 * @param {string} name - Column name to normalize
 * @returns {string} Normalized name
 */
const normalizeColumnName = (name) => {
  if (!name) return '';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\.]+/g, '');
};

/**
 * Build a lookup map from normalized names to canonical column names
 * for each sheet
 */
const buildColumnLookup = () => {
  const lookup = {};
  
  Object.entries(SHEET_COLUMNS).forEach(([sheetName, columns]) => {
    lookup[sheetName] = {};
    columns.forEach(canonicalName => {
      const normalized = normalizeColumnName(canonicalName);
      lookup[sheetName][normalized] = canonicalName;
      
      // Also add common variations
      // e.g., "ExpenseID" -> "expenseid", "expense id", "expense_id"
      // The normalized version handles most cases already
    });
  });
  
  return lookup;
};

const COLUMN_LOOKUP = buildColumnLookup();

/**
 * Map a raw column name to its canonical form for a given sheet
 * @param {string} rawName - Raw column name from Excel
 * @param {string} sheetName - Sheet name for context
 * @returns {string|null} Canonical column name or null if not recognized
 */
const mapToCanonicalColumn = (rawName, sheetName) => {
  const normalized = normalizeColumnName(rawName);
  const sheetLookup = COLUMN_LOOKUP[sheetName];
  
  if (!sheetLookup) return null;
  return sheetLookup[normalized] || null;
};

/**
 * Normalize all keys in a row object to canonical column names
 * @param {Object} row - Raw row object
 * @param {string} sheetName - Sheet name for context
 * @returns {Object} Row with normalized keys
 */
const normalizeRowKeys = (row, sheetName) => {
  const normalized = {};
  
  Object.entries(row).forEach(([key, value]) => {
    const canonical = mapToCanonicalColumn(key, sheetName);
    if (canonical) {
      normalized[canonical] = value;
    } else {
      // Keep unrecognized columns as-is (lowercase key)
      normalized[key] = value;
    }
  });
  
  return normalized;
};

// ============================================================================
// DATA CONVERSION UTILITIES
// ============================================================================

/**
 * Convert a value to a number
 * Handles strings with currency symbols, commas, etc.
 * @param {*} value - Value to convert
 * @returns {number} Converted number (0 if not convertible)
 */
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  // Remove currency symbols, commas, whitespace
  const cleaned = String(value)
    .replace(/[$€£¥,\s]/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Convert a value to an ISO date string
 * Handles Date objects, ISO strings, Excel serial numbers, and formatted strings
 * @param {*} value - Value to convert
 * @returns {string} ISO date string (YYYY-MM-DD) or empty string
 */
const toDateString = (value) => {
  if (value === null || value === undefined || value === '') return '';
  
  // Already a Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    return value.toISOString().split('T')[0];
  }
  
  // Excel serial number (number between 1 and ~2958465)
  if (typeof value === 'number' && value > 1 && value < 3000000) {
    // Excel epoch is 1900-01-01 (with the Lotus 1-2-3 bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }
  
  // String value
  const str = String(value).trim();
  if (!str) return '';
  
  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Try common date formats
  // MM/DD/YYYY or DD/MM/YYYY - assume MM/DD/YYYY for US format
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [p1, p2, p3] = parts.map(p => parseInt(p, 10));
    
    let year, month, day;
    
    if (p1 > 31) {
      // YYYY/MM/DD
      year = p1;
      month = p2;
      day = p3;
    } else if (p3 > 31) {
      // MM/DD/YYYY
      month = p1;
      day = p2;
      year = p3;
    } else {
      // Ambiguous - assume MM/DD/YYYY
      month = p1;
      day = p2;
      year = p3 < 100 ? 2000 + p3 : p3;
    }
    
    if (year && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // Last resort: try Date constructor
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString().split('T')[0];
  }
  
  return '';
};

/**
 * Check if a row is completely empty
 * @param {Object} row - Row object
 * @returns {boolean} True if all values are empty
 */
const isEmptyRow = (row) => {
  return Object.values(row).every(value => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (typeof value === 'number') return false; // Numbers are not empty
    return false;
  });
};

// ============================================================================
// SHEET-TO-OBJECTS CONVERSION
// ============================================================================

/**
 * Convert an Excel sheet to an array of JavaScript objects
 * - Normalizes column names to canonical form
 * - Filters out completely empty rows
 * - Applies type conversions based on sheet schema
 * 
 * @param {Object} sheet - XLSX sheet object
 * @param {string} sheetName - Name of the sheet (for column mapping context)
 * @returns {{ rows: Array, errors: string[] }}
 */
export const convertSheetToObjects = (sheet, sheetName) => {
  const errors = [];
  
  if (!sheet) {
    return { rows: [], errors: [`Sheet "${sheetName}" is empty or invalid`] };
  }
  
  // Convert sheet to JSON with raw values
  // defval: '' ensures missing cells get empty string instead of undefined
  let rawRows;
  try {
    rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
      raw: true, // Keep raw values for proper type handling
    });
  } catch (err) {
    return { rows: [], errors: [`Failed to parse sheet "${sheetName}": ${err.message}`] };
  }
  
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return { rows: [], errors: [] };
  }
  
  // Normalize column names and filter empty rows
  const normalizedRows = rawRows
    .filter(row => !isEmptyRow(row))
    .map(row => normalizeRowKeys(row, sheetName));
  
  // Apply type conversions based on sheet
  const convertedRows = normalizedRows.map((row, index) => {
    return applyTypeConversions(row, sheetName, index + 1, errors);
  });
  
  return { rows: convertedRows, errors };
};

/**
 * Apply type-specific conversions to a row based on its sheet
 * @param {Object} row - Normalized row
 * @param {string} sheetName - Sheet name
 * @param {number} rowIndex - Row number (for error messages)
 * @param {string[]} errors - Array to push errors into
 * @returns {Object} Row with converted values
 */
const applyTypeConversions = (row, sheetName, rowIndex, errors) => {
  const converted = { ...row };
  
  switch (sheetName) {
    case SHEET_NAMES.EXPENSES:
      // Convert Amount to number
      if (COLUMNS.EXPENSES.AMOUNT in converted) {
        const original = converted[COLUMNS.EXPENSES.AMOUNT];
        converted[COLUMNS.EXPENSES.AMOUNT] = toNumber(original);
        if (original !== '' && converted[COLUMNS.EXPENSES.AMOUNT] === 0 && toNumber(original) === 0) {
          // Only warn if original wasn't already 0 or empty
          if (String(original).trim() !== '' && String(original).trim() !== '0') {
            errors.push(`Row ${rowIndex}: Invalid Amount value "${original}"`);
          }
        }
      }
      // Convert Date to ISO string
      if (COLUMNS.EXPENSES.DATE in converted) {
        const dateStr = toDateString(converted[COLUMNS.EXPENSES.DATE]);
        if (converted[COLUMNS.EXPENSES.DATE] !== '' && !dateStr) {
          errors.push(`Row ${rowIndex}: Invalid Date value "${converted[COLUMNS.EXPENSES.DATE]}"`);
        }
        converted[COLUMNS.EXPENSES.DATE] = dateStr;
      }
      break;
      
    case SHEET_NAMES.DEBTS:
      // Convert OriginalAmount to number
      if (COLUMNS.DEBTS.ORIGINAL_AMOUNT in converted) {
        const original = converted[COLUMNS.DEBTS.ORIGINAL_AMOUNT];
        converted[COLUMNS.DEBTS.ORIGINAL_AMOUNT] = toNumber(original);
      }
      // Convert Date to ISO string
      if (COLUMNS.DEBTS.DATE in converted) {
        converted[COLUMNS.DEBTS.DATE] = toDateString(converted[COLUMNS.DEBTS.DATE]);
      }
      // Convert DueDate to ISO string
      if (COLUMNS.DEBTS.DUE_DATE in converted) {
        converted[COLUMNS.DEBTS.DUE_DATE] = toDateString(converted[COLUMNS.DEBTS.DUE_DATE]);
      }
      // Normalize Direction value
      if (COLUMNS.DEBTS.DIRECTION in converted) {
        const dir = String(converted[COLUMNS.DEBTS.DIRECTION]).trim();
        const validDirections = Object.values(DEBT_DIRECTION);
        const matched = validDirections.find(d => d.toLowerCase() === dir.toLowerCase());
        if (dir && !matched) {
          errors.push(`Row ${rowIndex}: Invalid Direction "${dir}". Expected: ${validDirections.join(', ')}`);
        }
        converted[COLUMNS.DEBTS.DIRECTION] = matched || dir;
      }
      // Normalize DebtCategory value
      if (COLUMNS.DEBTS.DEBT_CATEGORY in converted) {
        const cat = String(converted[COLUMNS.DEBTS.DEBT_CATEGORY]).trim();
        const validCategories = Object.values(DEBT_CATEGORY);
        const matched = validCategories.find(c => c.toLowerCase() === cat.toLowerCase());
        if (cat && !matched) {
          errors.push(`Row ${rowIndex}: Invalid DebtCategory "${cat}". Expected: ${validCategories.join(', ')}`);
        }
        converted[COLUMNS.DEBTS.DEBT_CATEGORY] = matched || cat;
      }
      break;
      
    case SHEET_NAMES.DEBT_RETURNS:
      // Convert Amount to number
      if (COLUMNS.DEBT_RETURNS.AMOUNT in converted) {
        converted[COLUMNS.DEBT_RETURNS.AMOUNT] = toNumber(converted[COLUMNS.DEBT_RETURNS.AMOUNT]);
      }
      // Convert Date to ISO string
      if (COLUMNS.DEBT_RETURNS.DATE in converted) {
        converted[COLUMNS.DEBT_RETURNS.DATE] = toDateString(converted[COLUMNS.DEBT_RETURNS.DATE]);
      }
      break;
      
    case SHEET_NAMES.CATEGORIES:
      // Normalize Type value
      if (COLUMNS.CATEGORIES.TYPE in converted) {
        const type = String(converted[COLUMNS.CATEGORIES.TYPE]).trim();
        const validTypes = Object.values(CATEGORY_TYPE);
        const matched = validTypes.find(t => t.toLowerCase() === type.toLowerCase());
        if (type && !matched) {
          errors.push(`Row ${rowIndex}: Invalid Type "${type}". Expected: ${validTypes.join(', ')}`);
        }
        converted[COLUMNS.CATEGORIES.TYPE] = matched || type;
      }
      break;
      
    default:
      break;
  }
  
  return converted;
};

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that a sheet has the required columns
 * @param {Array} rows - Array of row objects (already normalized)
 * @param {string} sheetName - Sheet name
 * @returns {{ valid: boolean, missing: string[], errors: string[] }}
 */
const validateColumns = (rows, sheetName) => {
  const errors = [];
  const requiredColumns = SHEET_COLUMNS[sheetName] || [];
  
  if (rows.length === 0) {
    return { valid: true, missing: [], errors };
  }
  
  // Check columns from the first row (they should be consistent)
  const firstRow = rows[0];
  const presentColumns = Object.keys(firstRow);
  
  const missing = requiredColumns.filter(col => !presentColumns.includes(col));
  
  if (missing.length > 0) {
    errors.push(
      `Sheet "${sheetName}" is missing required columns: ${missing.join(', ')}`
    );
  }
  
  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
};

// ============================================================================
// WORKBOOK PARSING
// ============================================================================

/**
 * Parse an XLSX workbook into structured data
 * - Detects required and optional sheets
 * - Converts each sheet to objects
 * - Validates required columns
 * - Handles missing sheets gracefully
 * 
 * @param {Object} workbook - XLSX workbook object
 * @returns {{ 
 *   expenses: Array, 
 *   debts: Array, 
 *   debtReturns: Array, 
 *   categories: Array,
 *   errors: string[],
 *   warnings: string[]
 * }}
 */
export const parseWorkbook = (workbook) => {
  const result = {
    expenses: [],
    debts: [],
    debtReturns: [],
    categories: [],
    errors: [],
    warnings: [],
  };
  
  if (!workbook || !workbook.Sheets) {
    result.errors.push('Invalid workbook: no sheets found');
    return result;
  }
  
  const sheetNames = workbook.SheetNames || [];
  
  // Map of sheet names to result keys
  const sheetMapping = [
    { sheetName: SHEET_NAMES.EXPENSES, key: 'expenses', required: true },
    { sheetName: SHEET_NAMES.DEBTS, key: 'debts', required: false },
    { sheetName: SHEET_NAMES.DEBT_RETURNS, key: 'debtReturns', required: false },
    { sheetName: SHEET_NAMES.CATEGORIES, key: 'categories', required: true },
  ];
  
  sheetMapping.forEach(({ sheetName, key, required }) => {
    // Check if sheet exists
    if (!sheetNames.includes(sheetName)) {
      if (required) {
        result.errors.push(`Required sheet "${sheetName}" not found in workbook`);
      } else {
        result.warnings.push(`Optional sheet "${sheetName}" not found (skipped)`);
      }
      return;
    }
    
    // Convert sheet to objects
    const sheet = workbook.Sheets[sheetName];
    const { rows, errors: conversionErrors } = convertSheetToObjects(sheet, sheetName);
    
    if (conversionErrors.length > 0) {
      result.warnings.push(...conversionErrors.map(e => `[${sheetName}] ${e}`));
    }
    
    // Validate columns
    const { valid, missing, errors: validationErrors } = validateColumns(rows, sheetName);
    
    if (!valid) {
      result.errors.push(...validationErrors);
    }
    
    // Store data
    result[key] = rows;
  });
  
  return result;
};

// ============================================================================
// FILE READING
// ============================================================================

/**
 * Read an Excel file and return structured data
 * 
 * @param {File} file - File object from file input
 * @returns {Promise<{
 *   expenses: Array,
 *   debts: Array,
 *   debtReturns: Array,
 *   categories: Array,
 *   errors: string[],
 *   warnings: string[]
 * }>}
 */
export const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file) {
      resolve({
        expenses: [],
        debts: [],
        debtReturns: [],
        categories: [],
        errors: ['No file provided'],
        warnings: [],
      });
      return;
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.xlsm')) {
      resolve({
        expenses: [],
        debts: [],
        debtReturns: [],
        categories: [],
        errors: [`Invalid file type. Expected .xlsx, .xls, or .xlsm. Got: ${file.name}`],
        warnings: [],
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        
        // Read workbook with cellDates to auto-convert date cells
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        
        const result = parseWorkbook(workbook);
        
        // Validate the imported data
        const validationResult = validateImportedData(result);
        
        // Add validation results to the result object
        result.validation = validationResult;
        result.validationFormatted = formatValidationErrors(validationResult);
        
        resolve(result);
      } catch (error) {
        resolve({
          expenses: [],
          debts: [],
          debtReturns: [],
          categories: [],
          errors: [`Failed to read Excel file: ${error.message}`],
          warnings: [],
          validation: null,
          validationFormatted: null,
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        expenses: [],
        debts: [],
        debtReturns: [],
        categories: [],
        errors: ['Failed to read file from disk'],
        warnings: [],
      });
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// ============================================================================
// WORKBOOK CREATION & EXPORT
// ============================================================================

/**
 * Create an XLSX workbook from structured data
 * 
 * @param {{
 *   expenses?: Array,
 *   debts?: Array,
 *   debtReturns?: Array,
 *   categories?: Array
 * }} data - Data object with arrays for each sheet
 * @returns {Object} XLSX workbook object
 */
export const createWorkbook = (data) => {
  const workbook = XLSX.utils.book_new();
  
  // Sheet configuration: name, data key, column order
  const sheetsConfig = [
    { 
      name: SHEET_NAMES.EXPENSES, 
      key: 'expenses',
      columns: SHEET_COLUMNS[SHEET_NAMES.EXPENSES] 
    },
    { 
      name: SHEET_NAMES.DEBTS, 
      key: 'debts',
      columns: SHEET_COLUMNS[SHEET_NAMES.DEBTS] 
    },
    { 
      name: SHEET_NAMES.DEBT_RETURNS, 
      key: 'debtReturns',
      columns: SHEET_COLUMNS[SHEET_NAMES.DEBT_RETURNS] 
    },
    { 
      name: SHEET_NAMES.CATEGORIES, 
      key: 'categories',
      columns: SHEET_COLUMNS[SHEET_NAMES.CATEGORIES] 
    },
  ];
  
  sheetsConfig.forEach(({ name, key, columns }) => {
    const sheetData = data[key] || [];
    
    // Ensure all rows have the correct column structure
    const formattedData = sheetData.map(row => {
      const formatted = {};
      columns.forEach(col => {
        formatted[col] = row[col] !== undefined ? row[col] : '';
      });
      return formatted;
    });
    
    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(
      formattedData.length > 0 ? formattedData : [createEmptyRow(columns)],
      { header: columns }
    );
    
    // Auto-size columns
    const colWidths = columns.map(col => {
      const maxDataLength = formattedData.reduce((max, row) => {
        const cellLength = String(row[col] || '').length;
        return Math.max(max, cellLength);
      }, 0);
      return { wch: Math.max(col.length, maxDataLength) + 2 };
    });
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });
  
  return workbook;
};

/**
 * Create an empty row with all columns set to empty string
 * @param {string[]} columns - Column names
 * @returns {Object} Empty row
 */
const createEmptyRow = (columns) => {
  const row = {};
  columns.forEach(col => {
    row[col] = '';
  });
  return row;
};

/**
 * Export data to an Excel file
 * 
 * @param {{
 *   expenses?: Array,
 *   debts?: Array,
 *   debtReturns?: Array,
 *   categories?: Array
 * }} data - Data object with arrays for each sheet
 * @param {string} filename - Output filename (without extension)
 * @returns {boolean} True if export succeeded
 */
export const exportToExcel = (data, filename = 'finance-data') => {
  try {
    const workbook = createWorkbook(data);
    
    // Sanitize filename
    const safeFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    XLSX.writeFile(workbook, `${safeFilename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Failed to export Excel file:', error);
    return false;
  }
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Create an empty template workbook with headers only
 * @returns {Object} XLSX workbook object
 */
export const createEmptyTemplate = () => {
  const emptyData = {
    expenses: [],
    debts: [],
    debtReturns: [],
    categories: [],
  };
  return createWorkbook(emptyData);
};

/**
 * Download an empty template Excel file
 * @param {string} filename - Output filename
 */
export const downloadTemplate = (filename = 'finance-template') => {
  const workbook = createEmptyTemplate();
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Get sheet names from an Excel file
 * @param {File} file - File object
 * @returns {Promise<string[]>} Array of sheet names
 */
export const getSheetNames = (file) => {
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
