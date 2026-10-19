import { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '../common';
import { COLUMNS, DEBT_DIRECTION, DEBT_CATEGORY } from '../../config/excelSchema';
import { formatCurrency } from '../../utils/currencyUtils';
import { getCurrentDate } from '../../utils/dateUtils';
import {
  getUniquePersons,
  getEligibleDebts,
  calculateTotalOutstanding,
  previewAllocation,
  commitBulkRepayment,
} from '../../services/bulkRepaymentService';
import { AlertCircle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

/**
 * BulkRepaymentModal
 * 
 * Multi-step modal for recording a bulk repayment that gets automatically
 * allocated across a person's outstanding debts (oldest first).
 * 
 * Steps:
 *   1. Select person, direction, debt category
 *   2. Enter amount, date, notes — see live allocation preview
 *   3. Confirm and commit (calls Supabase RPC atomically)
 * 
 * Props:
 *   isOpen, onClose, onSuccess, debts, debtReturns
 */
export default function BulkRepaymentModal({
  isOpen,
  onClose,
  onSuccess,
  debts = [],
  debtReturns = [],
}) {
  // Step tracking: 'select' | 'preview' | 'confirming'
  const [step, setStep] = useState('select');

  // Step 1: Selection
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedDirection, setSelectedDirection] = useState(DEBT_DIRECTION.LENT);
  const [selectedDebtCategory, setSelectedDebtCategory] = useState(DEBT_CATEGORY.CASH);

  // Step 2: Payment details
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [notes, setNotes] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedPerson('');
      setSelectedDirection(DEBT_DIRECTION.LENT);
      setSelectedDebtCategory(DEBT_CATEGORY.CASH);
      setAmount('');
      setDate(getCurrentDate());
      setNotes('');
      setError(null);
      setSuccessResult(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Unique persons from debts
  const persons = useMemo(() => getUniquePersons(debts), [debts]);

  // Person options for select
  const personOptions = useMemo(() => {
    return [
      { value: '', label: 'Select person...' },
      ...persons.map((p) => ({ value: p, label: p })),
    ];
  }, [persons]);

  // Direction options
  const directionOptions = [
    { value: DEBT_DIRECTION.LENT, label: 'Lent (Money I should receive back)' },
    { value: DEBT_DIRECTION.BORROWED, label: 'Borrowed (Money I need to pay back)' },
  ];

  // Debt category options
  const debtCategoryOptions = [
    { value: DEBT_CATEGORY.CASH, label: 'Cash' },
    { value: DEBT_CATEGORY.FOOD, label: 'Food' },
  ];

  // Eligible debts for current selection
  const eligibleDebts = useMemo(() => {
    return getEligibleDebts(
      debts,
      debtReturns,
      selectedPerson,
      selectedDirection,
      selectedDebtCategory
    );
  }, [debts, debtReturns, selectedPerson, selectedDirection, selectedDebtCategory]);

  // Total outstanding for current selection
  const totalOutstanding = useMemo(() => {
    return calculateTotalOutstanding(eligibleDebts);
  }, [eligibleDebts]);

  // Preview allocation (recomputes whenever inputs change)
  const preview = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      return null;
    }
    return previewAllocation(eligibleDebts, parsedAmount);
  }, [eligibleDebts, amount]);

  // Can proceed to step 2?
  const canProceedToPreview =
    selectedPerson &&
    selectedDirection &&
    selectedDebtCategory &&
    eligibleDebts.length > 0;

  // Can commit?
  const canCommit =
    preview &&
    preview.isValid &&
    preview.unallocated === 0 &&
    date &&
    !isSubmitting;

  // Handle "Next" from step 1 to step 2
  const handleNext = () => {
    if (!canProceedToPreview) return;
    setError(null);
    setStep('preview');
  };

  // Handle "Back" from step 2 to step 1
  const handleBack = () => {
    setError(null);
    setStep('select');
  };

  // Handle commit
  const handleCommit = async () => {
    if (!canCommit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await commitBulkRepayment({
        person: selectedPerson,
        direction: selectedDirection,
        debtCategory: selectedDebtCategory,
        totalAmount: parseFloat(amount),
        date,
        notes,
      });

      setSuccessResult(result);
      setStep('confirming');

      // Notify parent to refresh data
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Bulk repayment failed:', err);
      setError(err.message || 'Bulk repayment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (isSubmitting) return; // Don't close during submission
    onClose();
  };

  // Get modal title based on step
  const getTitle = () => {
    switch (step) {
      case 'select':
        return 'Record Bulk Repayment';
      case 'preview':
        return 'Preview Allocation';
      case 'confirming':
        return successResult ? 'Repayment Successful' : 'Processing...';
      default:
        return 'Record Bulk Repayment';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      size="lg"
    >
      {/* ================================================================= */}
      {/* STEP 1: SELECT PERSON, DIRECTION, CATEGORY */}
      {/* ================================================================= */}
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Select the person, direction, and debt category to see their outstanding debts.
            The repayment will be allocated oldest-first across eligible debts.
          </p>

          <Select
            label="Person"
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            options={personOptions}
            required
          />

          <Select
            label="Direction"
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value)}
            options={directionOptions}
            required
          />

          <Select
            label="Debt Category"
            value={selectedDebtCategory}
            onChange={(e) => setSelectedDebtCategory(e.target.value)}
            options={debtCategoryOptions}
            required
          />

          {/* Outstanding summary */}
          {selectedPerson && (
            <div className="p-4 bg-surface-50 rounded-lg border border-surface-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-600">Eligible Debts</p>
                  <p className="text-2xl font-bold text-surface-900">
                    {eligibleDebts.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-surface-600">Total Outstanding</p>
                  <p className="text-2xl font-bold text-surface-900">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
              </div>

              {eligibleDebts.length === 0 && (
                <p className="text-sm text-amber-600 mt-3">
                  No outstanding debts found for this person with the selected direction and category.
                </p>
              )}

              {eligibleDebts.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-surface-600 uppercase">
                    Debts (oldest first):
                  </p>
                  {eligibleDebts.map(({ debt, remaining }) => (
                    <div
                      key={debt[COLUMNS.DEBTS.DEBT_ID]}
                      className="flex items-center justify-between text-sm py-1 border-b border-surface-100 last:border-0"
                    >
                      <span className="text-surface-700">
                        {debt[COLUMNS.DEBTS.DATE]} — {debt[COLUMNS.DEBTS.DEBT_ID]}
                      </span>
                      <span className="font-semibold text-surface-900">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceedToPreview}
              className="flex-1"
              icon={ArrowRight}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 2: ENTER AMOUNT, DATE, NOTES — PREVIEW ALLOCATION */}
      {/* ================================================================= */}
      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            Enter the repayment amount. It will be automatically allocated to{' '}
            <strong>{selectedPerson}</strong>'s outstanding {selectedDirection.toLowerCase()} /{' '}
            {selectedDebtCategory.toLowerCase()} debts, oldest first.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              error={
                preview && !preview.isValid ? preview.error : null
              }
              helperText={
                !preview || preview.isValid
                  ? `Maximum: ${formatCurrency(totalOutstanding)}`
                  : null
              }
            />

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Bulk repayment for October"
          />

          {/* Allocation Preview */}
          {preview && preview.isValid && preview.allocations.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Allocation Preview
              </h4>
              <div className="space-y-2">
                {preview.allocations.map(({ debt, allocated, remainingBefore, remainingAfter }) => (
                  <div
                    key={debt[COLUMNS.DEBTS.DEBT_ID]}
                    className="bg-white rounded p-3 border border-blue-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-900">
                        {debt[COLUMNS.DEBTS.DEBT_ID]} — {debt[COLUMNS.DEBTS.DATE]}
                      </span>
                      <span className="text-sm font-bold text-blue-700">
                        Allocating: {formatCurrency(allocated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-surface-600">
                      <span>
                        Before: {formatCurrency(remainingBefore)}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span>
                        After: {formatCurrency(remainingAfter)}
                      </span>
                    </div>
                    {remainingAfter === 0 && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ Fully settled
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">Total Allocated:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(preview.totalAllocated)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleCommit}
              disabled={!canCommit}
              loading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 3: SUCCESS / ERROR */}
      {/* ================================================================= */}
      {step === 'confirming' && (
        <div className="space-y-4">
          {successResult ? (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    Bulk Repayment Saved Successfully
                  </p>
                  <p className="text-sm text-green-800">
                    {successResult.allocations_count} allocation{successResult.allocations_count !== 1 ? 's' : ''}{' '}
                    recorded for {successResult.person} ({successResult.direction} / {successResult.debt_category}).
                  </p>
                  <p className="text-sm text-green-800 mt-1">
                    Total paid: {formatCurrency(successResult.total_paid)}
                  </p>
                </div>
              </div>

              {/* Allocation details */}
              {successResult.allocations && successResult.allocations.length > 0 && (
                <div className="p-4 bg-surface-50 rounded-lg border border-surface-200">
                  <h4 className="text-sm font-semibold text-surface-900 mb-3">
                    Recorded Allocations
                  </h4>
                  <div className="space-y-2">
                    {successResult.allocations.map((alloc) => (
                      <div
                        key={alloc.return_id}
                        className="flex items-center justify-between text-sm py-1 border-b border-surface-100 last:border-0"
                      >
                        <span className="text-surface-700">
                          {alloc.debt_id}
                        </span>
                        <span className="font-semibold text-surface-900">
                          {formatCurrency(alloc.allocated)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="primary" onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              <span className="ml-2 text-surface-700">Processing...</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
