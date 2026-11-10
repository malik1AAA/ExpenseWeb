import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, DollarSign, AlertCircle, Check, X } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button, DeleteConfirmation, Input } from '../components/common';
import { DebtSummary, DebtTable, DebtForm, DebtReturnForm, DebtReturnsList, DebtDetails, DebtFilters, BulkRepaymentModal, DebtPaymentRequestForm } from '../components/debts';
import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';
import { Modal } from '../components/common';
import { filterDebts } from '../services/debtFilterService';
import { formatCurrency } from '../utils/currencyUtils';
import PersonFormModal from '../components/people/PersonFormModal';
import { createPerson, fetchDebtPaymentRequests, fetchPeople, flushDebtNotifications, reviewDebtPaymentRequest, submitDebtPaymentRequest } from '../services/peopleService';
import { getDebtReturnKey } from '../services/debtService';

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
  const [people, setPeople] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestError, setRequestError] = useState('');
  const [peopleError, setPeopleError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [isQuickPersonOpen, setIsQuickPersonOpen] = useState(false);
  const [debtForRequest, setDebtForRequest] = useState(null);
  const [isOwnerInitiatedRequest, setIsOwnerInitiatedRequest] = useState(false);
  const personResolver = useRef(null);

  const loadPeople = useCallback(async () => {
    try {
      setPeople(await fetchPeople());
      setPeopleError('');
    } catch (error) {
      setPeopleError(error.message || 'Could not load people.');
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      setRequests(await fetchDebtPaymentRequests());
      setRequestError('');
    } catch (error) {
      setRequestError(error.message || 'Could not load repayment requests.');
    }
  }, []);

  useEffect(() => {
    loadPeople();
    loadRequests();
  }, [loadPeople, loadRequests]);

  const ownsDebt = useCallback(
    (debt) => debt[COLUMNS.DEBTS.IS_OWNER] === true,
    []
  );
  const requiresParticipantConfirmation = useCallback(
    (debt) => people.some(person =>
      person.id === debt[COLUMNS.DEBTS.PERSON_ID] && person.has_linked_account
    ),
    [people]
  );

  const notifyAfterTransaction = useCallback(async () => {
    try {
      const result = await flushDebtNotifications();
      if (result?.failed > 0) {
        setEmailWarning(`${result.failed} email notification(s) could not be sent. Retry after checking email setup.`);
      } else {
        setEmailWarning('');
      }
    } catch (error) {
      console.error('Debt notification delivery failed after saving:', error);
      const reason = error instanceof Error && error.message ? ` ${error.message}` : '';
      setEmailWarning(`The financial change was saved, but an email notification could not be sent.${reason}`);
    }
  }, []);

  const handleQuickPersonAdd = useCallback(() => new Promise((resolve) => {
    personResolver.current = resolve;
    setIsQuickPersonOpen(true);
  }), []);

  const handleQuickPersonSave = useCallback(async (personData) => {
    const person = await createPerson(personData);
    setPeople(current => [...current, person].sort((a, b) => a.name.localeCompare(b.name)));
    setIsQuickPersonOpen(false);
    personResolver.current?.(person);
    personResolver.current = null;
    return person;
  }, []);

  const handleQuickPersonClose = useCallback(() => {
    setIsQuickPersonOpen(false);
    personResolver.current?.(null);
    personResolver.current = null;
  }, []);

  // Create a map of debt returns by debt ID for O(1) lookups
  const debtReturnsByDebtId = useMemo(() => {
    const map = new Map();
    debtReturns.forEach((ret) => {
      const debtId = ret[COLUMNS.DEBT_RETURNS.DEBT_DATABASE_ID] || ret[COLUMNS.DEBT_RETURNS.DEBT_ID];
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
      const debtId = getDebtReturnKey(debt);
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
        await notifyAfterTransaction();
      } catch (error) {
        // Error is already handled in FinanceContext, but we need to re-throw
        // so the form knows the submission failed
        throw error;
      }
    },
    [editingDebt, updateDebt, addDebt, notifyAfterTransaction]
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
    await loadRequests();
    await notifyAfterTransaction();
  }, [refreshData, loadRequests, notifyAfterTransaction]);

  const handleOpenPaymentRequest = useCallback((debt, ownerInitiated) => {
    setDebtForRequest(debt);
    setIsOwnerInitiatedRequest(ownerInitiated);
  }, []);

  const handleSubmitPaymentRequest = useCallback(async ({ amount, paymentDate, notes }) => {
    await submitDebtPaymentRequest({
      debtPk: debtForRequest?.[COLUMNS.DEBTS.DATABASE_ID],
      amount,
      paymentDate,
      notes,
    });
    await Promise.all([loadRequests(), refreshData()]);
    await notifyAfterTransaction();
  }, [debtForRequest, loadRequests, refreshData, notifyAfterTransaction]);

  const handleReviewRequest = useCallback(async (request, approve, rejectionReason = '') => {
    setRequestError('');
    try {
      await reviewDebtPaymentRequest(request.id, approve, rejectionReason);
      await Promise.all([loadRequests(), refreshData()]);
      await notifyAfterTransaction();
    } catch (error) {
      setRequestError(error.message || 'Could not review repayment request.');
    }
  }, [loadRequests, refreshData, notifyAfterTransaction]);

  const requestDebt = useCallback((request) =>
    debts.find(debt => debt[COLUMNS.DEBTS.DATABASE_ID] === request.debt_pk), [debts]);
  const visibleRequests = requests
    .map(request => ({ request, debt: requestDebt(request) }))
    .filter(item => item.debt);

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
      {peopleError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{peopleError}</p>}
      {emailWarning && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{emailWarning}</p>}
      {emailWarning && (
        <Button type="button" size="sm" variant="secondary" onClick={notifyAfterTransaction}>
          Retry email notifications
        </Button>
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
        canManageDebt={ownsDebt}
        requiresParticipantConfirmation={requiresParticipantConfirmation}
        onRecordReturn={handleRecordPayment}
        onSubmitRepaymentRequest={handleOpenPaymentRequest}
        onViewDetails={handleViewDetails}
      />

      <section className="overflow-hidden rounded-xl border border-surface-200 bg-white">
        <div className="border-b border-surface-200 px-5 py-4">
          <h2 className="font-semibold text-surface-900">Repayment Requests</h2>
          <p className="mt-1 text-sm text-surface-500">Pending requests do not change outstanding balances.</p>
        </div>
        {requestError && <p role="alert" className="px-5 py-3 text-sm text-red-700">{requestError}</p>}
        {visibleRequests.length === 0 ? (
          <p className="px-5 py-6 text-sm text-surface-500">No repayment requests.</p>
        ) : (
          <div className="divide-y divide-surface-100">
            {visibleRequests.map(({ request, debt }) => {
              const isOwner = ownsDebt(debt);
              const canReview = request.status === 'pending' &&
                ((debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT && isOwner) ||
                 (debt[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.BORROWED && !isOwner));
              return (
                <article key={request.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid flex-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs text-surface-500">Person / debt</p><p className="font-medium">{debt[COLUMNS.DEBTS.PERSON]} · {request.debt_id}</p></div>
                    <div><p className="text-xs text-surface-500">Original / outstanding</p><p>{formatCurrency(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT])} / {formatCurrency(calculateRemaining(debt))}</p></div>
                    <div><p className="text-xs text-surface-500">Requested / date</p><p>{formatCurrency(request.amount)} · {request.payment_date}</p></div>
                    <div><p className="text-xs text-surface-500">Status</p><p className="capitalize">{request.status}{request.notes ? ` · ${request.notes}` : ''}</p></div>
                  </div>
                  {canReview && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        aria-label="Optional rejection reason"
                        placeholder="Optional rejection reason"
                        value={rejectionReasons[request.id] || ''}
                        onChange={event => setRejectionReasons(current => ({ ...current, [request.id]: event.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="primary" icon={Check} onClick={() => handleReviewRequest(request, true)}>Confirm</Button>
                        <Button type="button" size="sm" variant="danger" icon={X} onClick={() => handleReviewRequest(request, false, rejectionReasons[request.id] || '')}>Reject</Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Add/Edit Form Modal */}
      <DebtForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        debt={editingDebt}
        people={people}
        onAddPerson={handleQuickPersonAdd}
      />

      <PersonFormModal
        isOpen={isQuickPersonOpen}
        onClose={handleQuickPersonClose}
        onSubmit={handleQuickPersonSave}
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

      <DebtPaymentRequestForm
        isOpen={Boolean(debtForRequest)}
        onClose={() => setDebtForRequest(null)}
        onSubmit={handleSubmitPaymentRequest}
        debt={debtForRequest}
        remainingAmount={debtForRequest ? calculateRemaining(debtForRequest) : 0}
        isOwnerInitiated={isOwnerInitiatedRequest}
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
            debt={debtForReturnsList}
            onDeleteReturn={ownsDebt(debtForReturnsList) ? handleDeleteReturn : undefined}
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
        debts={debts.filter(ownsDebt)}
        debtReturns={debtReturns}
      />
    </div>
  );
}
