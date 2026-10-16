import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, List } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button, DeleteConfirmation } from '../components/common';
import { DebtSummary, DebtTable, DebtForm, DebtReturnForm, DebtReturnsList, DebtDetails } from '../components/debts';
import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { Modal } from '../components/common';

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

  // Tab state
  const [activeTab, setActiveTab] = useState('all');

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

  // Get direction for new debt based on active tab
  const getDefaultDirection = () => {
    if (activeTab === 'lent') return DEBT_DIRECTION.LENT;
    if (activeTab === 'borrowed') return DEBT_DIRECTION.BORROWED;
    return DEBT_DIRECTION.LENT;
  };

  const tabs = [
    { id: 'all', label: 'All Debts', icon: List },
    { id: 'lent', label: 'Money Lent', icon: ArrowUpRight },
    { id: 'borrowed', label: 'Money Borrowed', icon: ArrowDownRight },
  ];

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

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-surface-200 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debt Table */}
      <DebtTable
        debts={debts}
        debtReturns={debtReturns}
        direction={activeTab === 'all' ? 'all' : activeTab === 'lent' ? DEBT_DIRECTION.LENT : DEBT_DIRECTION.BORROWED}
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
        defaultDirection={getDefaultDirection()}
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
