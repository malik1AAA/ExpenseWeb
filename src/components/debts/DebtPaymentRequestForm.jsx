import { useEffect, useState } from 'react';
import { Button, Input, Modal, Textarea } from '../common';
import { formatCurrency } from '../../utils/currencyUtils';
import { getCurrentDate } from '../../utils/dateUtils';

export default function DebtPaymentRequestForm({
  isOpen,
  onClose,
  onSubmit,
  debt,
  remainingAmount = 0,
  isOwnerInitiated = false,
}) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getCurrentDate());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setPaymentDate(getCurrentDate());
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!debt) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    if (parsedAmount > remainingAmount) {
      setError(`Amount cannot exceed the outstanding balance of ${formatCurrency(remainingAmount)}.`);
      return;
    }
    if (!paymentDate) {
      setError('Payment date is required.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSubmit({ amount: parsedAmount, paymentDate, notes });
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'Could not submit the repayment request.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaving ? () => {} : onClose}
      title={isOwnerInitiated ? 'Request Payment Confirmation' : 'Submit Repayment Request'}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg bg-surface-50 p-4 text-sm">
          <p className="font-medium text-surface-900">{debt.Person}</p>
          <p className="mt-1 text-surface-600">
            Outstanding: <strong>{formatCurrency(remainingAmount)}</strong>
          </p>
          <p className="mt-2 text-xs text-surface-500">
            {isOwnerInitiated
              ? 'The repayment will be recorded only after the linked person confirms receipt.'
              : 'This request will not change the balance until the debt owner approves it.'}
          </p>
        </div>
        <Input
          label="Payment Amount"
          type="number"
          min="0.01"
          max={remainingAmount}
          step="0.01"
          value={amount}
          onChange={event => setAmount(event.target.value)}
          required
        />
        <Input
          label="Payment Date"
          type="date"
          value={paymentDate}
          onChange={event => setPaymentDate(event.target.value)}
          required
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={event => setNotes(event.target.value)}
          maxLength={500}
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSaving} disabled={isSaving} className="flex-1">
            {isOwnerInitiated ? 'Send for Confirmation' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
