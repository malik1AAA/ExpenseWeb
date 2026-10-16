/**
 * Data Integrity Checker Service
 * Performs comprehensive validation checks on financial data
 * Does NOT modify data - only reports issues
 */

import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { parseISO, isValid } from 'date-fns';

/**
 * Check result structure
 */
const createCheckResult = (name, status, message, count = 0) => ({
  name,
  status, // 'passed', 'warning', 'error'
  message,
  count,
  details: [],
});

/**
 * 1. Check for duplicate ExpenseIDs
 */
export const checkDuplicateExpenseIDs = (expenses) => {
  const idMap = new Map();
  const duplicates = [];

  expenses.forEach((expense, index) => {
    const id = expense[COLUMNS.EXPENSES.EXPENSE_ID];
    if (!id) {
      duplicates.push({ index, id: 'MISSING', expense });
      return;
    }

    if (idMap.has(id)) {
      duplicates.push({ index, id, expense });
      const original = idMap.get(id);
      if (!duplicates.find(d => d.index === original)) {
        duplicates.push({ index: original, id, expense: expenses[original] });
      }
    } else {
      idMap.set(id, index);
    }
  });

  if (duplicates.length === 0) {
    return createCheckResult(
      'Duplicate ExpenseIDs',
      'passed',
      'No duplicate ExpenseIDs found',
      0
    );
  }

  return createCheckResult(
    'Duplicate ExpenseIDs',
    'error',
    `Found ${duplicates.length} duplicate or missing ExpenseIDs`,
    duplicates.length,
    duplicates.map(d => ({
      index: d.index,
      id: d.id,
      description: d.expense[COLUMNS.EXPENSES.DESCRIPTION],
      date: d.expense[COLUMNS.EXPENSES.DATE],
    }))
  );
};

/**
 * 2. Check for duplicate DebtIDs
 */
export const checkDuplicateDebtIDs = (debts) => {
  const idMap = new Map();
  const duplicates = [];

  debts.forEach((debt, index) => {
    const id = debt[COLUMNS.DEBTS.DEBT_ID];
    if (!id) {
      duplicates.push({ index, id: 'MISSING', debt });
      return;
    }

    if (idMap.has(id)) {
      duplicates.push({ index, id, debt });
      const original = idMap.get(id);
      if (!duplicates.find(d => d.index === original)) {
        duplicates.push({ index: original, id, debt: debts[original] });
      }
    } else {
      idMap.set(id, index);
    }
  });

  if (duplicates.length === 0) {
    return createCheckResult(
      'Duplicate DebtIDs',
      'passed',
      'No duplicate DebtIDs found',
      0
    );
  }

  return createCheckResult(
    'Duplicate DebtIDs',
    'error',
    `Found ${duplicates.length} duplicate or missing DebtIDs`,
    duplicates.length,
    duplicates.map(d => ({
      index: d.index,
      id: d.id,
      person: d.debt[COLUMNS.DEBTS.PERSON],
      date: d.debt[COLUMNS.DEBTS.DATE],
    }))
  );
};

/**
 * 3. Check for duplicate ReturnIDs
 */
export const checkDuplicateReturnIDs = (debtReturns) => {
  const idMap = new Map();
  const duplicates = [];

  debtReturns.forEach((ret, index) => {
    const id = ret[COLUMNS.DEBT_RETURNS.RETURN_ID];
    if (!id) {
      duplicates.push({ index, id: 'MISSING', ret });
      return;
    }

    if (idMap.has(id)) {
      duplicates.push({ index, id, ret });
      const original = idMap.get(id);
      if (!duplicates.find(d => d.index === original)) {
        duplicates.push({ index: original, id, ret: debtReturns[original] });
      }
    } else {
      idMap.set(id, index);
    }
  });

  if (duplicates.length === 0) {
    return createCheckResult(
      'Duplicate ReturnIDs',
      'passed',
      'No duplicate ReturnIDs found',
      0
    );
  }

  return createCheckResult(
    'Duplicate ReturnIDs',
    'error',
    `Found ${duplicates.length} duplicate or missing ReturnIDs`,
    duplicates.length,
    duplicates.map(d => ({
      index: d.index,
      id: d.id,
      debtId: d.ret[COLUMNS.DEBT_RETURNS.DEBT_ID],
      date: d.ret[COLUMNS.DEBT_RETURNS.DATE],
    }))
  );
};

/**
 * 4. Check for expenses with missing categories
 */
export const checkMissingCategories = (expenses, categories) => {
  const categoryIds = new Set(categories.map(c => c[COLUMNS.CATEGORIES.CATEGORY_ID]));
  const missing = [];

  expenses.forEach((expense, index) => {
    const categoryId = expense[COLUMNS.EXPENSES.CATEGORY];
    if (!categoryId || !categoryIds.has(categoryId)) {
      missing.push({
        index,
        categoryId: categoryId || 'MISSING',
        description: expense[COLUMNS.EXPENSES.DESCRIPTION],
        date: expense[COLUMNS.EXPENSES.DATE],
      });
    }
  });

  if (missing.length === 0) {
    return createCheckResult(
      'Missing Categories',
      'passed',
      'All expenses have valid categories',
      0
    );
  }

  return createCheckResult(
    'Missing Categories',
    'warning',
    `Found ${missing.length} expenses with missing or invalid categories`,
    missing.length,
    missing
  );
};

/**
 * 5. Check for DebtReturns referencing missing debts
 */
export const checkOrphanedReturns = (debtReturns, debts) => {
  const debtIds = new Set(debts.map(d => d[COLUMNS.DEBTS.DEBT_ID]));
  const orphaned = [];

  debtReturns.forEach((ret, index) => {
    const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
    if (!debtId || !debtIds.has(debtId)) {
      orphaned.push({
        index,
        returnId: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
        debtId: debtId || 'MISSING',
        date: ret[COLUMNS.DEBT_RETURNS.DATE],
        amount: ret[COLUMNS.DEBT_RETURNS.AMOUNT],
      });
    }
  });

  if (orphaned.length === 0) {
    return createCheckResult(
      'Orphaned Debt Returns',
      'passed',
      'All debt returns reference valid debts',
      0
    );
  }

  return createCheckResult(
    'Orphaned Debt Returns',
    'error',
    `Found ${orphaned.length} debt returns referencing non-existent debts`,
    orphaned.length,
    orphaned
  );
};

/**
 * 6. Check for negative amounts
 */
export const checkNegativeAmounts = (expenses, debts, debtReturns) => {
  const issues = [];

  // Check expenses
  expenses.forEach((expense, index) => {
    const amount = parseFloat(expense[COLUMNS.EXPENSES.AMOUNT]);
    if (amount < 0) {
      issues.push({
        type: 'Expense',
        index,
        id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
        description: expense[COLUMNS.EXPENSES.DESCRIPTION],
        amount,
      });
    }
  });

  // Check debts
  debts.forEach((debt, index) => {
    const amount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]);
    if (amount < 0) {
      issues.push({
        type: 'Debt',
        index,
        id: debt[COLUMNS.DEBTS.DEBT_ID],
        description: debt[COLUMNS.DEBTS.PERSON],
        amount,
      });
    }
  });

  // Check debt returns
  debtReturns.forEach((ret, index) => {
    const amount = parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT]);
    if (amount < 0) {
      issues.push({
        type: 'Debt Return',
        index,
        id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
        description: `Return for ${ret[COLUMNS.DEBT_RETURNS.DEBT_ID]}`,
        amount,
      });
    }
  });

  if (issues.length === 0) {
    return createCheckResult(
      'Negative Amounts',
      'passed',
      'No negative amounts found',
      0
    );
  }

  return createCheckResult(
    'Negative Amounts',
    'error',
    `Found ${issues.length} records with negative amounts`,
    issues.length,
    issues
  );
};

/**
 * 7. Check for invalid dates
 */
export const checkInvalidDates = (expenses, debts, debtReturns) => {
  const issues = [];

  // Check expense dates
  expenses.forEach((expense, index) => {
    const dateStr = expense[COLUMNS.EXPENSES.DATE];
    if (!dateStr) {
      issues.push({
        type: 'Expense Date',
        index,
        id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
        description: expense[COLUMNS.EXPENSES.DESCRIPTION],
        date: 'MISSING',
      });
    } else {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        issues.push({
          type: 'Expense Date',
          index,
          id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
          description: expense[COLUMNS.EXPENSES.DESCRIPTION],
          date: dateStr,
        });
      }
    }
  });

  // Check debt dates
  debts.forEach((debt, index) => {
    const dateStr = debt[COLUMNS.DEBTS.DATE];
    if (!dateStr) {
      issues.push({
        type: 'Debt Date',
        index,
        id: debt[COLUMNS.DEBTS.DEBT_ID],
        description: debt[COLUMNS.DEBTS.PERSON],
        date: 'MISSING',
      });
    } else {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        issues.push({
          type: 'Debt Date',
          index,
          id: debt[COLUMNS.DEBTS.DEBT_ID],
          description: debt[COLUMNS.DEBTS.PERSON],
          date: dateStr,
        });
      }
    }
  });

  // Check debt return dates
  debtReturns.forEach((ret, index) => {
    const dateStr = ret[COLUMNS.DEBT_RETURNS.DATE];
    if (!dateStr) {
      issues.push({
        type: 'Return Date',
        index,
        id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
        description: `Return for ${ret[COLUMNS.DEBT_RETURNS.DEBT_ID]}`,
        date: 'MISSING',
      });
    } else {
      const date = parseISO(dateStr);
      if (!isValid(date)) {
        issues.push({
          type: 'Return Date',
          index,
          id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
          description: `Return for ${ret[COLUMNS.DEBT_RETURNS.DEBT_ID]}`,
          date: dateStr,
        });
      }
    }
  });

  if (issues.length === 0) {
    return createCheckResult(
      'Invalid Dates',
      'passed',
      'All dates are valid',
      0
    );
  }

  return createCheckResult(
    'Invalid Dates',
    'error',
    `Found ${issues.length} records with invalid or missing dates`,
    issues.length,
    issues
  );
};

/**
 * 8. Check for returns exceeding debt amounts
 */
export const checkReturnsExceedingDebt = (debtReturns, debts) => {
  const issues = [];

  // Group returns by debt ID
  const returnsByDebt = new Map();
  debtReturns.forEach((ret) => {
    const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
    if (!returnsByDebt.has(debtId)) {
      returnsByDebt.set(debtId, []);
    }
    returnsByDebt.get(debtId).push(ret);
  });

  // Check each debt
  debts.forEach((debt) => {
    const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
    const originalAmount = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
    const returns = returnsByDebt.get(debtId) || [];

    const totalReturned = returns.reduce(
      (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
      0
    );

    if (totalReturned > originalAmount) {
      issues.push({
        debtId,
        person: debt[COLUMNS.DEBTS.PERSON],
        originalAmount,
        totalReturned,
        excess: totalReturned - originalAmount,
        returnCount: returns.length,
      });
    }
  });

  if (issues.length === 0) {
    return createCheckResult(
      'Returns Exceeding Debt',
      'passed',
      'No returns exceed original debt amounts',
      0
    );
  }

  return createCheckResult(
    'Returns Exceeding Debt',
    'error',
    `Found ${issues.length} debts where returns exceed original amount`,
    issues.length,
    issues
  );
};

/**
 * 9. Check for invalid Direction values
 */
export const checkInvalidDirections = (debts) => {
  const validDirections = Object.values(DEBT_DIRECTION);
  const issues = [];

  debts.forEach((debt, index) => {
    const direction = debt[COLUMNS.DEBTS.DIRECTION];
    if (!direction || !validDirections.includes(direction)) {
      issues.push({
        index,
        debtId: debt[COLUMNS.DEBTS.DEBT_ID],
        person: debt[COLUMNS.DEBTS.PERSON],
        direction: direction || 'MISSING',
        validValues: validDirections.join(', '),
      });
    }
  });

  if (issues.length === 0) {
    return createCheckResult(
      'Invalid Direction Values',
      'passed',
      'All debts have valid direction values',
      0
    );
  }

  return createCheckResult(
    'Invalid Direction Values',
    'error',
    `Found ${issues.length} debts with invalid direction values`,
    issues.length,
    issues
  );
};

/**
 * 10. Check for missing required fields
 */
export const checkMissingRequiredFields = (expenses, debts, debtReturns) => {
  const issues = [];

  // Check expenses
  expenses.forEach((expense, index) => {
    const missing = [];
    if (!expense[COLUMNS.EXPENSES.EXPENSE_ID]) missing.push('ExpenseID');
    if (!expense[COLUMNS.EXPENSES.DATE]) missing.push('Date');
    if (!expense[COLUMNS.EXPENSES.DESCRIPTION]) missing.push('Description');
    if (!expense[COLUMNS.EXPENSES.CATEGORY]) missing.push('Category');
    if (expense[COLUMNS.EXPENSES.AMOUNT] === undefined || expense[COLUMNS.EXPENSES.AMOUNT] === null) {
      missing.push('Amount');
    }

    if (missing.length > 0) {
      issues.push({
        type: 'Expense',
        index,
        id: expense[COLUMNS.EXPENSES.EXPENSE_ID] || 'N/A',
        missing,
      });
    }
  });

  // Check debts
  debts.forEach((debt, index) => {
    const missing = [];
    if (!debt[COLUMNS.DEBTS.DEBT_ID]) missing.push('DebtID');
    if (!debt[COLUMNS.DEBTS.PERSON]) missing.push('Person');
    if (!debt[COLUMNS.DEBTS.DIRECTION]) missing.push('Direction');
    if (debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] === undefined || debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] === null) {
      missing.push('OriginalAmount');
    }
    if (!debt[COLUMNS.DEBTS.DATE]) missing.push('Date');

    if (missing.length > 0) {
      issues.push({
        type: 'Debt',
        index,
        id: debt[COLUMNS.DEBTS.DEBT_ID] || 'N/A',
        missing,
      });
    }
  });

  // Check debt returns
  debtReturns.forEach((ret, index) => {
    const missing = [];
    if (!ret[COLUMNS.DEBT_RETURNS.RETURN_ID]) missing.push('ReturnID');
    if (!ret[COLUMNS.DEBT_RETURNS.DEBT_ID]) missing.push('DebtID');
    if (!ret[COLUMNS.DEBT_RETURNS.DATE]) missing.push('Date');
    if (ret[COLUMNS.DEBT_RETURNS.AMOUNT] === undefined || ret[COLUMNS.DEBT_RETURNS.AMOUNT] === null) {
      missing.push('Amount');
    }

    if (missing.length > 0) {
      issues.push({
        type: 'Debt Return',
        index,
        id: ret[COLUMNS.DEBT_RETURNS.RETURN_ID] || 'N/A',
        missing,
      });
    }
  });

  if (issues.length === 0) {
    return createCheckResult(
      'Missing Required Fields',
      'passed',
      'All required fields are present',
      0
    );
  }

  return createCheckResult(
    'Missing Required Fields',
    'error',
    `Found ${issues.length} records with missing required fields`,
    issues.length,
    issues
  );
};

/**
 * Run all integrity checks
 */
export const runIntegrityChecks = (expenses, debts, debtReturns, categories) => {
  const results = {
    checks: [
      checkDuplicateExpenseIDs(expenses),
      checkDuplicateDebtIDs(debts),
      checkDuplicateReturnIDs(debtReturns),
      checkMissingCategories(expenses, categories),
      checkOrphanedReturns(debtReturns, debts),
      checkNegativeAmounts(expenses, debts, debtReturns),
      checkInvalidDates(expenses, debts, debtReturns),
      checkReturnsExceedingDebt(debtReturns, debts),
      checkInvalidDirections(debts),
      checkMissingRequiredFields(expenses, debts, debtReturns),
    ],
    summary: {
      total: 10,
      passed: 0,
      warnings: 0,
      errors: 0,
    },
  };

  // Calculate summary
  results.checks.forEach(check => {
    if (check.status === 'passed') results.summary.passed++;
    else if (check.status === 'warning') results.summary.warnings++;
    else if (check.status === 'error') results.summary.errors++;
  });

  return results;
};
