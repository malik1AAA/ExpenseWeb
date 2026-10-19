import { useState, useMemo, useCallback } from 'react';
import { Plus, DollarSign, AlertCircle } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button, DeleteConfirmation } from '../components/common';
import { DebtSummary, DebtTable, DebtForm, DebtReturnForm, DebtReturnsList, DebtDetails, DebtFilters, BulkRepaymentModal } from '../components/debts';
import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { Modal } from '../components/common';
import { filterDebts } from '../services/debtFilterService';

export default function Debts() {
  const {
    debts,
    debtReturns,
    errors,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtReturn,
    deleteDebtReturn,
    refreshData,
    clearErrors,
  } = useFinance();

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    direction: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState(null);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [debtForReturn, setDebtForReturn] = useState(null);
  const [isReturnsListOpen, setIsReturnsListOpen] = useState(false);
  const [debtForReturnsList, setDebtForReturnsList] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [debtForDetails, setDebtForDetails] = useState(null);
  const [isBulkRepaymentOpen, setIsBulkRepaymentOpen] = useState(false);

  // Create a map of debt returns by debt ID for O(1) lookups
  const debtReturnsByDebtId = useMemo(() => {
    const map = new Map();
    debtReturns.forEach((ret) => {
      const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
      if (!map.has(debtId)) {
        map.set(debtId, []);
      }
      map.get(debtId).push(ret);
    });
    return map;
  }, [debtReturns]);

  // Calculate remaining amount for a debt (memoized)
  const calculateRemaining = useCallback(
    (debt) => {
      const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
      const returns = debtReturnsByDebtId.get(debtId) || [];
      const totalReturned = returns.reduce(
        (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
        0
      );
      return debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned;
    },
    [debtReturnsByDebtId]
  );

  // Memoize filtered debts to avoid recalculation on every render
  const filteredDebts = useMemo(
    () => filterDebts(debts, debtReturns, filters),
    [debts, debtReturns, filters]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Handle add debt
  const handleAddDebt = useCallback(() => {
    setEditingDebt(null);
    setIsFormOpen(true);
  }, []);

  // Handle edit debt
  const handleEditDebt = useCallback((debt) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  }, []);

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (debtData) => {
      try {
        if (editingDebt) {
          // Update existing debt
          await updateDebt(editingDebt[COLUMNS.DEBTS.DEBT_ID], debtData);
        } else {
          // Add new debt
          await addDebt(debtData);
        }
      } catch (error) {
        // Error is already handled in FinanceContext, but we need to re-throw
        // so the form knows the submission failed
        throw error;
      }
    },
    [editingDebt, updateDebt, addDebt]
  );

  // Handle delete request
  const handleDeleteRequest = useCallback((debt) => {
    setDebtToDelete(debt);
    setIsDeleteConfirmOpen(true);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    if (debtToDelete) {
      deleteDebt(debtToDelete[COLUMNS.DEBTS.DEBT_ID]);
      setDebtToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  }, [debtToDelete, deleteDebt]);

  // Handle record payment
  const handleRecordPayment = useCallback((debt) => {
    setDebtForReturn(debt);
    setIsReturnFormOpen(true);
  }, []);

  // Handle return form submit
  const handleReturnFormSubmit = useCallback(
    (returnData) => {
      addDebtReturn(returnData);
    },
    [addDebtReturn]
  );

  // Handle view payment history
  const handleViewPayments = useCallback((debt) => {
    setDebtForReturnsList(debt);
    setIsReturnsListOpen(true);
  }, []);

  // Handle delete return
  const handleDeleteReturn = useCallback(
    (returnId) => {
      deleteDebtReturn(returnId);
    },
    [deleteDebtReturn]
  );

  // Handle view details
  const handleViewDetails = useCallback((debt) => {
    setDebtForDetails(debt);
    setIsDetailsOpen(true);
  }, []);

  // Handle bulk repayment success - refresh data
  const handleBulkRepaymentSuccess = useCallback(async () => {
    if (refreshData) {
      await refreshData();
    }
  }, [refreshData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Debts"
        description="Track money lent and borrowed"
      >
        <Button
          variant="secondary"
          icon={DollarSign}
          onClick={() => setIsBulkRepaymentOpen(true)}
        >
          Record Bulk Repayment
        </Button>
        <Button variant="primary" icon={Plus} onClick={handleAddDebt}>
          Add Debt
        </Button>
      </PageHeader>

      {/* Error Display */}
      {errors && errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                {errors.length === 1 ? 'Error' : 'Errors'}
              </h3>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={clearErrors}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <DebtSummary debts={filteredDebts} debtReturns={debtReturns} />

      {/* Filters */}
      <DebtFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Debt Table */}
      <DebtTable
        debts={filteredDebts}
        debtReturns={debtReturns}
        onEdit={handleEditDebt}
        onDelete={handleDeleteRequest}
        onRecordReturn={handleRecordPayment}
        onViewDetails={handleViewDetails}
      />

      {/* Add/Edit Form Modal */}
      <DebtForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        debt={editingDebt}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Debt"
        message={`Are you sure you want to delete the debt with "${debtToDelete?.[COLUMNS.DEBTS.PERSON]}"? This action cannot be undone.`}
      />

      {/* Record Payment Modal */}
      <DebtReturnForm
        isOpen={isReturnFormOpen}
        onClose={() => setIsReturnFormOpen(false)}
        onSubmit={handleReturnFormSubmit}
        debt={debtForReturn}
        remainingAmount={debtForReturn ? calculateRemaining(debtForReturn) : 0}
      />

      {/* Payment History Modal */}
      <Modal
        isOpen={isReturnsListOpen}
        onClose={() => setIsReturnsListOpen(false)}
        title="Payment History"
        size="md"
      >
        {debtForReturnsList && (
          <DebtReturnsList
            debtReturns={debtReturns}
            debtId={debtForReturnsList[COLUMNS.DEBTS.DEBT_ID]}
            onDeleteReturn={handleDeleteReturn}
          />
        )}
      </Modal>

      {/* Debt Details Modal */}
      <DebtDetails
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        debt={debtForDetails}
        debtReturns={debtReturns}
      />

      {/* Bulk Repayment Modal */}
      <BulkRepaymentModal
        isOpen={isBulkRepaymentOpen}
        onClose={() => setIsBulkRepaymentOpen(false)}
        onSuccess={handleBulkRepaymentSuccess}
        debts={debts}
        debtReturns={debtReturns}
      />
    </div>
  );
}
