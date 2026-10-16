/**
 * Excel Data Validation Service
 * Validates imported Excel data before processing
 */

import { COLUMNS, SHEET_NAMES, DEBT_DIRECTION } from '../config/excelSchema';
import { parseISO, isValid } from 'date-fns';

/**
 * Validation result structure
 */
export const createValidationResult = () => ({
  isValid: true,
  errors: [],
  warnings: [],
  stats: {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
  },
});

/**
 * Add error to validation result
 */
export const addError = (result, sheet, row, field, message) => {
  result.isValid = false;
  result.errors.push({
    sheet,
    row,
    field,
    message,
  });
  result.stats.invalidRows++;
};

/**
 * Add warning to validation result
 */
export const addWarning = (result, sheet, row, field, message) => {
  result.warnings.push({
    sheet,
    row,
    field,
    message,
  });
};

/**
 * Validate required columns exist in data
 */
export const validateRequiredColumns = (data, sheetName, requiredColumns, result) => {
  if (!data || data.length === 0) {
    addWarning(result, sheetName, 0, null, 'Sheet is empty');
    return false;
  }

  const firstRow = data[0];
  const missingColumns = requiredColumns.filter(col => !(col in firstRow));

  if (missingColumns.length > 0) {
    addError(
      result,
      sheetName,
      0,
      null,
      `Missing required columns: ${missingColumns.join(', ')}`
    );
    return false;
  }

  return true;
};

/**
 * Validate date field
 */
export const validateDate = (value, sheetName, row, fieldName, result) => {
  if (!value || value === '') {
    addError(result, sheetName, row, fieldName, 'Date is required');
    return false;
  }

  const date = parseISO(value);
  if (!isValid(date)) {
    addError(result, sheetName, row, fieldName, `Invalid date format: ${value}`);
    return false;
  }

  return true;
};

/**
 * Validate number field
 */
export const validateNumber = (value, sheetName, row, fieldName, result, options = {}) => {
  const { required = true, positive = true, allowZero = true } = options;

  if (!value && value !== 0) {
    if (required) {
      addError(result, sheetName, row, fieldName, 'Amount is required');
      return false;
    }
    return true;
  }

  const num = Number(value);
  if (isNaN(num)) {
    addError(result, sheetName, row, fieldName, `Invalid number: ${value}`);
    return false;
  }

  if (positive && num < 0) {
    addError(result, sheetName, row, fieldName, 'Amount cannot be negative');
    return false;
  }

  if (!allowZero && num === 0) {
    addError(result, sheetName, row, fieldName, 'Amount cannot be zero');
    return false;
  }

  return true;
};

/**
 * Validate required text field
 */
export const validateRequiredText = (value, sheetName, row, fieldName, result) => {
  if (!value || String(value).trim() === '') {
    addError(result, sheetName, row, fieldName, `${fieldName} is required`);
    return false;
  }
  return true;
};

/**
 * Validate enum field
 */
export const validateEnum = (value, sheetName, row, fieldName, allowedValues, result) => {
  if (!value || String(value).trim() === '') {
    addError(result, sheetName, row, fieldName, `${fieldName} is required`);
    return false;
  }

  if (!allowedValues.includes(value)) {
    addError(
      result,
      sheetName,
      row,
      fieldName,
      `Invalid ${fieldName}: ${value}. Must be one of: ${allowedValues.join(', ')}`
    );
    return false;
  }

  return true;
};

/**
 * Check for duplicate IDs
 */
export const validateUniqueIds = (data, sheetName, idField, result) => {
  const ids = new Map();
  const duplicates = [];

  data.forEach((row, index) => {
    const id = row[idField];
    if (id) {
      if (ids.has(id)) {
        duplicates.push({ id, row: index + 1 });
      } else {
        ids.set(id, index + 1);
      }
    }
  });

  if (duplicates.length > 0) {
    duplicates.forEach(({ id, row }) => {
      addError(
        result,
        sheetName,
        row,
        idField,
        `Duplicate ${idField}: ${id}`
      );
    });
    return false;
  }

  return true;
};

/**
 * Validate Expenses sheet
 */
export const validateExpenses = (data, result) => {
  const sheetName = SHEET_NAMES.EXPENSES;
  const requiredColumns = [
    COLUMNS.EXPENSES.EXPENSE_ID,
    COLUMNS.EXPENSES.DATE,
    COLUMNS.EXPENSES.DESCRIPTION,
    COLUMNS.EXPENSES.CATEGORY,
    COLUMNS.EXPENSES.AMOUNT,
  ];

  result.stats.totalRows = data.length;

  if (!validateRequiredColumns(data, sheetName, requiredColumns, result)) {
    return;
  }

  // Validate unique IDs
  validateUniqueIds(data, sheetName, COLUMNS.EXPENSES.EXPENSE_ID, result);

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 1;
    let rowValid = true;

    // Validate Date
    if (!validateDate(row[COLUMNS.EXPENSES.DATE], sheetName, rowNum, COLUMNS.EXPENSES.DATE, result)) {
      rowValid = false;
    }

    // Validate Description
    if (!validateRequiredText(row[COLUMNS.EXPENSES.DESCRIPTION], sheetName, rowNum, COLUMNS.EXPENSES.DESCRIPTION, result)) {
      rowValid = false;
    }

    // Validate Category
    if (!validateRequiredText(row[COLUMNS.EXPENSES.CATEGORY], sheetName, rowNum, COLUMNS.EXPENSES.CATEGORY, result)) {
      rowValid = false;
    }

    // Validate Amount
    if (!validateNumber(row[COLUMNS.EXPENSES.AMOUNT], sheetName, rowNum, COLUMNS.EXPENSES.AMOUNT, result, {
      required: true,
      positive: true,
      allowZero: false,
    })) {
      rowValid = false;
    }

    if (rowValid) {
      result.stats.validRows++;
    }
  });
};

/**
 * Validate Debts sheet
 */
export const validateDebts = (data, result) => {
  const sheetName = SHEET_NAMES.DEBTS;
  const requiredColumns = [
    COLUMNS.DEBTS.DEBT_ID,
    COLUMNS.DEBTS.PERSON,
    COLUMNS.DEBTS.DIRECTION,
    COLUMNS.DEBTS.ORIGINAL_AMOUNT,
    COLUMNS.DEBTS.DATE,
  ];

  result.stats.totalRows = data.length;

  if (!validateRequiredColumns(data, sheetName, requiredColumns, result)) {
    return;
  }

  // Validate unique IDs
  validateUniqueIds(data, sheetName, COLUMNS.DEBTS.DEBT_ID, result);

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 1;
    let rowValid = true;

    // Validate Person
    if (!validateRequiredText(row[COLUMNS.DEBTS.PERSON], sheetName, rowNum, COLUMNS.DEBTS.PERSON, result)) {
      rowValid = false;
    }

    // Validate Direction
    if (!validateEnum(
      row[COLUMNS.DEBTS.DIRECTION],
      sheetName,
      rowNum,
      COLUMNS.DEBTS.DIRECTION,
      Object.values(DEBT_DIRECTION),
      result
    )) {
      rowValid = false;
    }

    // Validate OriginalAmount
    if (!validateNumber(row[COLUMNS.DEBTS.ORIGINAL_AMOUNT], sheetName, rowNum, COLUMNS.DEBTS.ORIGINAL_AMOUNT, result, {
      required: true,
      positive: true,
      allowZero: false,
    })) {
      rowValid = false;
    }

    // Validate Date
    if (!validateDate(row[COLUMNS.DEBTS.DATE], sheetName, rowNum, COLUMNS.DEBTS.DATE, result)) {
      rowValid = false;
    }

    if (rowValid) {
      result.stats.validRows++;
    }
  });
};

/**
 * Validate DebtReturns sheet
 */
export const validateDebtReturns = (data, debts, result) => {
  const sheetName = SHEET_NAMES.DEBT_RETURNS;
  const requiredColumns = [
    COLUMNS.DEBT_RETURNS.RETURN_ID,
    COLUMNS.DEBT_RETURNS.DEBT_ID,
    COLUMNS.DEBT_RETURNS.DATE,
    COLUMNS.DEBT_RETURNS.AMOUNT,
  ];

  result.stats.totalRows = data.length;

  if (!validateRequiredColumns(data, sheetName, requiredColumns, result)) {
    return;
  }

  // Validate unique IDs
  validateUniqueIds(data, sheetName, COLUMNS.DEBT_RETURNS.RETURN_ID, result);

  // Create a map of valid debt IDs and their amounts
  const debtMap = new Map();
  if (debts && debts.length > 0) {
    debts.forEach(debt => {
      const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      if (debtId) {
        debtMap.set(debtId, {
          originalAmount: Number(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]) || 0,
          totalReturned: 0,
        });
      }
    });
  }

  // Track returns per debt to check if total exceeds original
  const returnsByDebt = new Map();

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 1;
    let rowValid = true;

    // Validate DebtID exists
    const debtId = row[COLUMNS.DEBT_RETURNS.DEBT_ID];
    if (!debtId || String(debtId).trim() === '') {
      addError(result, sheetName, rowNum, COLUMNS.DEBT_RETURNS.DEBT_ID, 'DebtID is required');
      rowValid = false;
    } else if (!debtMap.has(debtId)) {
      addError(
        result,
        sheetName,
        rowNum,
        COLUMNS.DEBT_RETURNS.DEBT_ID,
        `DebtID does not exist: ${debtId}`
      );
      rowValid = false;
    }

    // Validate Date
    if (!validateDate(row[COLUMNS.DEBT_RETURNS.DATE], sheetName, rowNum, COLUMNS.DEBT_RETURNS.DATE, result)) {
      rowValid = false;
    }

    // Validate Amount
    const amount = Number(row[COLUMNS.DEBT_RETURNS.AMOUNT]);
    if (!validateNumber(row[COLUMNS.DEBT_RETURNS.AMOUNT], sheetName, rowNum, COLUMNS.DEBT_RETURNS.AMOUNT, result, {
      required: true,
      positive: true,
      allowZero: false,
    })) {
      rowValid = false;
    }

    // Track returns per debt
    if (debtId && debtMap.has(debtId) && !isNaN(amount) && amount > 0) {
      if (!returnsByDebt.has(debtId)) {
        returnsByDebt.set(debtId, 0);
      }
      const currentTotal = returnsByDebt.get(debtId);
      returnsByDebt.set(debtId, currentTotal + amount);

      // Check if total returns exceed original amount
      const debtInfo = debtMap.get(debtId);
      const newTotal = currentTotal + amount;
      if (newTotal > debtInfo.originalAmount) {
        addError(
          result,
          sheetName,
          rowNum,
          COLUMNS.DEBT_RETURNS.AMOUNT,
          `Total returns (${newTotal}) exceed original debt amount (${debtInfo.originalAmount}) for DebtID: ${debtId}`
        );
        rowValid = false;
      }
    }

    if (rowValid) {
      result.stats.validRows++;
    }
  });
};

/**
 * Validate Categories sheet
 */
export const validateCategories = (data, result) => {
  const sheetName = SHEET_NAMES.CATEGORIES;
  const requiredColumns = [
    COLUMNS.CATEGORIES.CATEGORY_ID,
    COLUMNS.CATEGORIES.CATEGORY_NAME,
  ];

  result.stats.totalRows = data.length;

  if (!validateRequiredColumns(data, sheetName, requiredColumns, result)) {
    return;
  }

  // Validate unique IDs
  validateUniqueIds(data, sheetName, COLUMNS.CATEGORIES.CATEGORY_ID, result);

  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 1;
    let rowValid = true;

    // Validate CategoryName
    if (!validateRequiredText(row[COLUMNS.CATEGORIES.CATEGORY_NAME], sheetName, rowNum, COLUMNS.CATEGORIES.CATEGORY_NAME, result)) {
      rowValid = false;
    }

    if (rowValid) {
      result.stats.validRows++;
    }
  });
};

/**
 * Main validation function
 * Validates all sheets in the imported data
 */
export const validateImportedData = (importedData) => {
  const result = createValidationResult();

  // Validate Expenses
  if (importedData.expenses && importedData.expenses.length > 0) {
    validateExpenses(importedData.expenses, result);
  }

  // Validate Debts
  if (importedData.debts && importedData.debts.length > 0) {
    validateDebts(importedData.debts, result);
  }

  // Validate DebtReturns (requires debts for cross-validation)
  if (importedData.debtReturns && importedData.debtReturns.length > 0) {
    validateDebtReturns(importedData.debtReturns, importedData.debts, result);
  }

  // Validate Categories
  if (importedData.categories && importedData.categories.length > 0) {
    validateCategories(importedData.categories, result);
  }

  return result;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (validationResult) => {
  if (validationResult.isValid) {
    return null;
  }

  const formatted = {
    summary: `Found ${validationResult.errors.length} error(s) and ${validationResult.warnings.length} warning(s)`,
    errors: validationResult.errors.map(err => ({
      sheet: err.sheet,
      location: err.row ? `Row ${err.row}` : 'Header',
      field: err.field || 'General',
      message: err.message,
    })),
    warnings: validationResult.warnings.map(warn => ({
      sheet: warn.sheet,
      location: warn.row ? `Row ${warn.row}` : 'Header',
      field: warn.field || 'General',
      message: warn.message,
    })),
  };

  return formatted;
};
