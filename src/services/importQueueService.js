/**
 * Import Queue Service
 * Manages sequential import of Excel data with dependency ordering
 * and progress tracking
 */

import { supabase } from '../lib/supabaseClient';
import { COLUMNS } from '../config/excelSchema';
import { generateExpenseId, generateDebtId, generateReturnId } from './idGeneratorService';

/**
 * Import status enum
 */
export const IMPORT_STATUS = {
  IDLE: 'idle',
  STAGING: 'staging',
  READY: 'ready',
  IMPORTING: 'importing',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * Import Queue Manager
 * Handles sequential processing of import records
 */
export class ImportQueueManager {
  constructor() {
    this.status = IMPORT_STATUS.IDLE;
    this.stagedData = null;
    this.progress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentTable: '',
      currentRecord: 0,
    };
    this.errors = [];
    this.cancelRequested = false;
    this.onProgressUpdate = null;
    this.importJobId = null;
  }

  /**
   * Stage parsed Excel data for import
   * @param {Object} parsedData - Data from excelService.parseWorkbook()
   */
  async stageData(parsedData) {
    this.status = IMPORT_STATUS.STAGING;
    this.errors = [];
    this.cancelRequested = false;

    try {
      // Validate and normalize staged data
      this.stagedData = {
        categories: this._normalizeCategories(parsedData.categories || []),
        expenses: this._normalizeExpenses(parsedData.expenses || []),
        debts: this._normalizeDebts(parsedData.debts || []),
        debtReturns: this._normalizeDebtReturns(parsedData.debtReturns || []),
      };

      // Calculate total records
      this.progress.total = 
        this.stagedData.categories.length +
        this.stagedData.expenses.length +
        this.stagedData.debts.length +
        this.stagedData.debtReturns.length;

      this.status = IMPORT_STATUS.READY;
      this._notifyProgress();

      return {
        success: true,
        summary: this._getStagingSummary(),
      };
    } catch (error) {
      this.status = IMPORT_STATUS.FAILED;
      this.errors.push({
        stage: 'staging',
        message: error.message,
      });
      this._notifyProgress();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute the import queue sequentially
   * @param {string} mode - 'replace' or 'merge'
   * @returns {Promise<Object>} Import result
   */
  async executeImport(mode = 'merge') {
    if (this.status !== IMPORT_STATUS.READY) {
      throw new Error('Import queue is not ready. Call stageData() first.');
    }

    this.status = IMPORT_STATUS.IMPORTING;
    this.importJobId = `import_${Date.now()}`;
    this.errors = [];
    this.cancelRequested = false;
    this.progress.processed = 0;
    this.progress.successful = 0;
    this.progress.failed = 0;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      this.status = IMPORT_STATUS.FAILED;
      this.errors.push({
        stage: 'authentication',
        message: 'User not authenticated',
      });
      this._notifyProgress();
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Handle replace mode
      if (mode === 'replace') {
        await this._clearExistingData(user.id);
      }

      // Process in dependency order
      // 1. Categories first (no dependencies)
      await this._processCategories(user.id);

      // 2. Expenses and Debts (depend on categories)
      await this._processExpenses(user.id);
      
      if (this.cancelRequested) {
        this.status = IMPORT_STATUS.CANCELLED;
        this._notifyProgress();
        return { success: false, cancelled: true };
      }

      await this._processDebts(user.id);

      if (this.cancelRequested) {
        this.status = IMPORT_STATUS.CANCELLED;
        this._notifyProgress();
        return { success: false, cancelled: true };
      }

      // 3. Debt Returns last (depend on debts)
      await this._processDebtReturns(user.id);

      // Determine final status
      if (this.progress.failed > 0) {
        this.status = IMPORT_STATUS.COMPLETED_WITH_ERRORS;
      } else {
        this.status = IMPORT_STATUS.COMPLETED;
      }

      this._notifyProgress();

      return {
        success: this.status === IMPORT_STATUS.COMPLETED,
        summary: {
          total: this.progress.total,
          successful: this.progress.successful,
          failed: this.progress.failed,
          errors: this.errors,
        },
      };
    } catch (error) {
      this.status = IMPORT_STATUS.FAILED;
      this.errors.push({
        stage: 'import',
        message: error.message,
      });
      this._notifyProgress();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel the import process
   */
  cancel() {
    this.cancelRequested = true;
  }

  /**
   * Reset the queue manager
   */
  reset() {
    this.status = IMPORT_STATUS.IDLE;
    this.stagedData = null;
    this.progress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentTable: '',
      currentRecord: 0,
    };
    this.errors = [];
    this.cancelRequested = false;
    this.importJobId = null;
  }

  /**
   * Set progress callback
   * @param {Function} callback - Progress update callback
   */
  setProgressCallback(callback) {
    this.onProgressUpdate = callback;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  _notifyProgress() {
    if (this.onProgressUpdate) {
      this.onProgressUpdate({
        status: this.status,
        progress: { ...this.progress },
        errors: [...this.errors],
      });
    }
  }

  _getStagingSummary() {
    return {
      categories: this.stagedData.categories.length,
      expenses: this.stagedData.expenses.length,
      debts: this.stagedData.debts.length,
      debtReturns: this.stagedData.debtReturns.length,
      total: this.progress.total,
    };
  }

  _normalizeCategories(categories) {
    return categories.map(cat => ({
      [COLUMNS.CATEGORIES.CATEGORY_ID]: cat[COLUMNS.CATEGORIES.CATEGORY_ID],
      [COLUMNS.CATEGORIES.CATEGORY_NAME]: cat[COLUMNS.CATEGORIES.CATEGORY_NAME],
      [COLUMNS.CATEGORIES.TYPE]: cat[COLUMNS.CATEGORIES.TYPE] || 'Expense',
    }));
  }

  _normalizeExpenses(expenses) {
    return expenses.map(exp => ({
      [COLUMNS.EXPENSES.EXPENSE_ID]: exp[COLUMNS.EXPENSES.EXPENSE_ID],
      [COLUMNS.EXPENSES.DATE]: exp[COLUMNS.EXPENSES.DATE],
      [COLUMNS.EXPENSES.DESCRIPTION]: exp[COLUMNS.EXPENSES.DESCRIPTION],
      [COLUMNS.EXPENSES.CATEGORY]: exp[COLUMNS.EXPENSES.CATEGORY],
      [COLUMNS.EXPENSES.AMOUNT]: parseFloat(exp[COLUMNS.EXPENSES.AMOUNT]) || 0,
      [COLUMNS.EXPENSES.PAYMENT_METHOD]: exp[COLUMNS.EXPENSES.PAYMENT_METHOD] || null,
      [COLUMNS.EXPENSES.NOTES]: exp[COLUMNS.EXPENSES.NOTES] || null,
    }));
  }

  _normalizeDebts(debts) {
    return debts.map(debt => ({
      [COLUMNS.DEBTS.DEBT_ID]: debt[COLUMNS.DEBTS.DEBT_ID],
      [COLUMNS.DEBTS.PERSON]: debt[COLUMNS.DEBTS.PERSON],
      [COLUMNS.DEBTS.DEBT_CATEGORY]: debt[COLUMNS.DEBTS.DEBT_CATEGORY],
      [COLUMNS.DEBTS.DIRECTION]: debt[COLUMNS.DEBTS.DIRECTION],
      [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]) || 0,
      [COLUMNS.DEBTS.DATE]: debt[COLUMNS.DEBTS.DATE],
      [COLUMNS.DEBTS.DUE_DATE]: debt[COLUMNS.DEBTS.DUE_DATE] || null,
      [COLUMNS.DEBTS.NOTES]: debt[COLUMNS.DEBTS.NOTES] || null,
    }));
  }

  _normalizeDebtReturns(returns) {
    return returns.map(ret => ({
      [COLUMNS.DEBT_RETURNS.RETURN_ID]: ret[COLUMNS.DEBT_RETURNS.RETURN_ID],
      [COLUMNS.DEBT_RETURNS.DEBT_ID]: ret[COLUMNS.DEBT_RETURNS.DEBT_ID],
      [COLUMNS.DEBT_RETURNS.DATE]: ret[COLUMNS.DEBT_RETURNS.DATE],
      [COLUMNS.DEBT_RETURNS.AMOUNT]: parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT]) || 0,
      [COLUMNS.DEBT_RETURNS.NOTES]: ret[COLUMNS.DEBT_RETURNS.NOTES] || null,
    }));
  }

  async _clearExistingData(userId) {
    // Delete in reverse dependency order
    await supabase.from('debt_returns').delete().eq('user_id', userId);
    await supabase.from('debts').delete().eq('user_id', userId);
    await supabase.from('expenses').delete().eq('user_id', userId);
    await supabase.from('categories').delete().eq('user_id', userId);
  }

  async _processCategories(userId) {
    this.progress.currentTable = 'categories';
    
    for (let i = 0; i < this.stagedData.categories.length; i++) {
      if (this.cancelRequested) break;

      this.progress.currentRecord = i + 1;
      this._notifyProgress();

      const category = this.stagedData.categories[i];
      
      try {
        const { error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            category_id: category[COLUMNS.CATEGORIES.CATEGORY_ID],
            category_name: category[COLUMNS.CATEGORIES.CATEGORY_NAME],
            type: category[COLUMNS.CATEGORIES.TYPE],
          });

        if (error) {
          throw error;
        }

        this.progress.successful++;
      } catch (error) {
        this.progress.failed++;
        this.errors.push({
          table: 'categories',
          record: i + 1,
          id: category[COLUMNS.CATEGORIES.CATEGORY_ID],
          message: error.message,
        });
      }

      this.progress.processed++;
      this._notifyProgress();
    }
  }

  async _processExpenses(userId) {
    this.progress.currentTable = 'expenses';
    
    for (let i = 0; i < this.stagedData.expenses.length; i++) {
      if (this.cancelRequested) break;

      this.progress.currentRecord = i + 1;
      this._notifyProgress();

      const expense = this.stagedData.expenses[i];
      let expenseId = expense[COLUMNS.EXPENSES.EXPENSE_ID];
      
      try {
        // Generate ID if missing
        if (!expenseId) {
          expenseId = await generateExpenseId();
        }

        const { error } = await supabase
          .from('expenses')
          .insert({
            user_id: userId,
            expense_id: expenseId,
            date: expense[COLUMNS.EXPENSES.DATE],
            description: expense[COLUMNS.EXPENSES.DESCRIPTION],
            category: expense[COLUMNS.EXPENSES.CATEGORY],
            amount: expense[COLUMNS.EXPENSES.AMOUNT],
            payment_method: expense[COLUMNS.EXPENSES.PAYMENT_METHOD],
            notes: expense[COLUMNS.EXPENSES.NOTES],
          });

        if (error) {
          throw error;
        }

        this.progress.successful++;
      } catch (error) {
        this.progress.failed++;
        this.errors.push({
          table: 'expenses',
          record: i + 1,
          id: expenseId,
          message: error.message,
        });
      }

      this.progress.processed++;
      this._notifyProgress();
    }
  }

  async _processDebts(userId) {
    this.progress.currentTable = 'debts';
    
    for (let i = 0; i < this.stagedData.debts.length; i++) {
      if (this.cancelRequested) break;

      this.progress.currentRecord = i + 1;
      this._notifyProgress();

      const debt = this.stagedData.debts[i];
      let debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      
      try {
        // Generate ID if missing
        if (!debtId) {
          debtId = await generateDebtId();
        }

        const { error } = await supabase
          .from('debts')
          .insert({
            user_id: userId,
            debt_id: debtId,
            person: debt[COLUMNS.DEBTS.PERSON],
            debt_category: debt[COLUMNS.DEBTS.DEBT_CATEGORY],
            direction: debt[COLUMNS.DEBTS.DIRECTION],
            original_amount: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT],
            date: debt[COLUMNS.DEBTS.DATE],
            due_date: debt[COLUMNS.DEBTS.DUE_DATE],
            notes: debt[COLUMNS.DEBTS.NOTES],
          });

        if (error) {
          throw error;
        }

        this.progress.successful++;
      } catch (error) {
        this.progress.failed++;
        this.errors.push({
          table: 'debts',
          record: i + 1,
          id: debtId,
          message: error.message,
        });
      }

      this.progress.processed++;
      this._notifyProgress();
    }
  }

  async _processDebtReturns(userId) {
    this.progress.currentTable = 'debt_returns';
    
    for (let i = 0; i < this.stagedData.debtReturns.length; i++) {
      if (this.cancelRequested) break;

      this.progress.currentRecord = i + 1;
      this._notifyProgress();

      const debtReturn = this.stagedData.debtReturns[i];
      let returnId = debtReturn[COLUMNS.DEBT_RETURNS.RETURN_ID];
      const debtId = debtReturn[COLUMNS.DEBT_RETURNS.DEBT_ID];
      
      try {
        // Verify parent debt exists
        const { data: parentDebt, error: checkError } = await supabase
          .from('debts')
          .select('debt_id')
          .eq('user_id', userId)
          .eq('debt_id', debtId)
          .single();

        if (checkError || !parentDebt) {
          throw new Error(`Parent debt ${debtId} not found`);
        }

        // Generate ID if missing
        if (!returnId) {
          returnId = await generateReturnId();
        }

        const { error } = await supabase
          .from('debt_returns')
          .insert({
            user_id: userId,
            return_id: returnId,
            debt_id: debtId,
            date: debtReturn[COLUMNS.DEBT_RETURNS.DATE],
            amount: debtReturn[COLUMNS.DEBT_RETURNS.AMOUNT],
            notes: debtReturn[COLUMNS.DEBT_RETURNS.NOTES],
          });

        if (error) {
          throw error;
        }

        this.progress.successful++;
      } catch (error) {
        this.progress.failed++;
        this.errors.push({
          table: 'debt_returns',
          record: i + 1,
          id: returnId,
          debtId: debtId,
          message: error.message,
        });
      }

      this.progress.processed++;
      this._notifyProgress();
    }
  }
}

// Singleton instance
export const importQueue = new ImportQueueManager();
