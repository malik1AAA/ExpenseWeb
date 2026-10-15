/**
 * Excel Schema Configuration
 * Defines the structure of the Excel workbook used for data storage
 */

// Sheet Names
export const SHEET_NAMES = {
  EXPENSES: 'Expenses',
  DEBTS: 'Debts',
  DEBT_RETURNS: 'DebtReturns',
  CATEGORIES: 'Categories',
};

// Column Definitions
export const COLUMNS = {
  EXPENSES: {
    EXPENSE_ID: 'ExpenseID',
    DATE: 'Date',
    DESCRIPTION: 'Description',
    CATEGORY: 'Category',
    AMOUNT: 'Amount',
    PAYMENT_METHOD: 'PaymentMethod',
    NOTES: 'Notes',
  },
  
  DEBTS: {
    DEBT_ID: 'DebtID',
    PERSON: 'Person',
    DEBT_CATEGORY: 'DebtCategory',
    DIRECTION: 'Direction',
    ORIGINAL_AMOUNT: 'OriginalAmount',
    DATE: 'Date',
    DUE_DATE: 'DueDate',
    NOTES: 'Notes',
  },
  
  DEBT_RETURNS: {
    RETURN_ID: 'ReturnID',
    DEBT_ID: 'DebtID',
    DATE: 'Date',
    AMOUNT: 'Amount',
    NOTES: 'Notes',
  },
  
  CATEGORIES: {
    CATEGORY_ID: 'CategoryID',
    CATEGORY_NAME: 'CategoryName',
    TYPE: 'Type',
  },
};

// Column arrays for each sheet (in order)
export const SHEET_COLUMNS = {
  [SHEET_NAMES.EXPENSES]: [
    COLUMNS.EXPENSES.EXPENSE_ID,
    COLUMNS.EXPENSES.DATE,
    COLUMNS.EXPENSES.DESCRIPTION,
    COLUMNS.EXPENSES.CATEGORY,
    COLUMNS.EXPENSES.AMOUNT,
    COLUMNS.EXPENSES.PAYMENT_METHOD,
    COLUMNS.EXPENSES.NOTES,
  ],
  
  [SHEET_NAMES.DEBTS]: [
    COLUMNS.DEBTS.DEBT_ID,
    COLUMNS.DEBTS.PERSON,
    COLUMNS.DEBTS.DEBT_CATEGORY,
    COLUMNS.DEBTS.DIRECTION,
    COLUMNS.DEBTS.ORIGINAL_AMOUNT,
    COLUMNS.DEBTS.DATE,
    COLUMNS.DEBTS.DUE_DATE,
    COLUMNS.DEBTS.NOTES,
  ],
  
  [SHEET_NAMES.DEBT_RETURNS]: [
    COLUMNS.DEBT_RETURNS.RETURN_ID,
    COLUMNS.DEBT_RETURNS.DEBT_ID,
    COLUMNS.DEBT_RETURNS.DATE,
    COLUMNS.DEBT_RETURNS.AMOUNT,
    COLUMNS.DEBT_RETURNS.NOTES,
  ],
  
  [SHEET_NAMES.CATEGORIES]: [
    COLUMNS.CATEGORIES.CATEGORY_ID,
    COLUMNS.CATEGORIES.CATEGORY_NAME,
    COLUMNS.CATEGORIES.TYPE,
  ],
};

// Enums and Constants
export const DEBT_DIRECTION = {
  LENT: 'Lent',
  BORROWED: 'Borrowed',
};

export const DEBT_CATEGORY = {
  FOOD: 'Food',
  CASH: 'Cash',
};

export const CATEGORY_TYPE = {
  EXPENSE: 'Expense',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
};

/**
 * Get required columns for a sheet
 * @param {string} sheetName - Sheet name
 * @returns {string[]} Array of required column names
 */
export const getRequiredColumns = (sheetName) => {
  return SHEET_COLUMNS[sheetName] || [];
};

/**
 * Validate that a row has all required columns
 * @param {Object} row - Data row
 * @param {string} sheetName - Sheet name
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const validateRow = (row, sheetName) => {
  const requiredColumns = getRequiredColumns(sheetName);
  const missing = requiredColumns.filter(col => !(col in row));
  
  return {
    valid: missing.length === 0,
    missing,
  };
};
