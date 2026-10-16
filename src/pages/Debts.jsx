import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button, DeleteConfirmation } from '../components/common';
import { DebtSummary, DebtTable, DebtForm, DebtReturnForm, DebtReturnsList, DebtDetails, DebtFilters } from '../components/debts';
import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { Modal } from '../components/common';
import { filterDebts } from '../services/debtFilterService';

export default function Debts() {
  const {
    debts,
    debtReturns,
    addDebt,
    updateDebt,
    deleteDebt,
    addDebtReturn,
    deleteDebtReturn,
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

  // Calculate remaining amount for a debt
  const calculateRemaining = (debt) => {
    const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
    const totalReturned = debtReturns
      .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
      .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
    
    return debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned;
  };

  // Apply filters
  const filteredDebts = filterDebts(debts, debtReturns, filters);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Handle add debt
  const handleAddDebt = () => {
    setEditingDebt(null);
    setIsFormOpen(true);
  };

  // Handle edit debt
  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setIsFormOpen(true);
  };

  // Handle form submit
  const handleFormSubmit = (debtData) => {
    if (editingDebt) {
      // Update existing debt
      updateDebt(editingDebt[COLUMNS.DEBTS.DEBT_ID], debtData);
    } else {
      // Add new debt
      addDebt(debtData);
    }
  };

  // Handle delete request
  const handleDeleteRequest = (debt) => {
    setDebtToDelete(debt);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (debtToDelete) {
      deleteDebt(debtToDelete[COLUMNS.DEBTS.DEBT_ID]);
      setDebtToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  // Handle record payment
  const handleRecordPayment = (debt) => {
    setDebtForReturn(debt);
    setIsReturnFormOpen(true);
  };

  // Handle return form submit
  const handleReturnFormSubmit = (returnData) => {
    addDebtReturn(returnData);
  };

  // Handle view payment history
  const handleViewPayments = (debt) => {
    setDebtForReturnsList(debt);
    setIsReturnsListOpen(true);
  };

  // Handle delete return
  const handleDeleteReturn = (returnId) => {
    deleteDebtReturn(returnId);
  };

  // Handle view details
  const handleViewDetails = (debt) => {
    setDebtForDetails(debt);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Debts"
        description="Track money lent and borrowed"
      >
        <Button variant="primary" icon={Plus} onClick={handleAddDebt}>
          Add Debt
        </Button>
      </PageHeader>

      {/* Summary */}
      <DebtSummary debts={debts} debtReturns={debtReturns} />

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
    </div>
  );
}
