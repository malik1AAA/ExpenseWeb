import { useState } from 'react';
import { Modal, Input, Textarea, Button } from '../common';
import { COLUMNS } from '../../config/excelSchema';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { getCurrentDate } from '../../utils/dateUtils';

/**
 * DebtReturnForm - Modal form for recording debt returns/payments
 */
export default function DebtReturnForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  debt,
  remainingAmount = 0
}) {
  const [formData, setFormData] = useState({
    [COLUMNS.DEBT_RETURNS.AMOUNT]: '',
    [COLUMNS.DEBT_RETURNS.DATE]: getCurrentDate(),
    [COLUMNS.DEBT_RETURNS.NOTES]: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    const amount = parseFloat(formData[COLUMNS.DEBT_RETURNS.AMOUNT]);
    if (!formData[COLUMNS.DEBT_RETURNS.AMOUNT] || isNaN(amount) || amount <= 0) {
      newErrors[COLUMNS.DEBT_RETURNS.AMOUNT] = 'Amount must be greater than 0';
    }

    if (amount > remainingAmount) {
      newErrors[COLUMNS.DEBT_RETURNS.AMOUNT] = `Amount cannot exceed remaining balance (${formatCurrency(remainingAmount)})`;
    }

    if (!formData[COLUMNS.DEBT_RETURNS.DATE]) {
      newErrors[COLUMNS.DEBT_RETURNS.DATE] = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const returnData = {
      ...formData,
      [COLUMNS.DEBT_RETURNS.DEBT_ID]: debt[COLUMNS.DEBTS.DEBT_ID],
      [COLUMNS.DEBT_RETURNS.AMOUNT]: parseFloat(formData[COLUMNS.DEBT_RETURNS.AMOUNT]),
    };

    onSubmit(returnData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!debt) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="md"
    >
      <div className="mb-6 p-4 bg-surface-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm text-surface-600">Person</p>
            <p className="text-lg font-semibold text-surface-900">
              {debt[COLUMNS.DEBTS.PERSON]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-surface-600">Remaining</p>
            <p className="text-lg font-semibold text-red-600">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-surface-200">
          <p className="text-sm text-surface-600">
            Due: {formatDate(debt[COLUMNS.DEBTS.DUE_DATE])}
          </p>
          <p className="text-sm text-surface-600">
            Original: {formatCurrency(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT])}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Payment Amount"
          type="number"
          step="0.01"
          min="0"
          max={remainingAmount}
          value={formData[COLUMNS.DEBT_RETURNS.AMOUNT]}
          onChange={(e) => handleChange(COLUMNS.DEBT_RETURNS.AMOUNT, e.target.value)}
          error={errors[COLUMNS.DEBT_RETURNS.AMOUNT]}
          placeholder="0.00"
          required
        />

        <Input
          label="Payment Date"
          type="date"
          value={formData[COLUMNS.DEBT_RETURNS.DATE]}
          onChange={(e) => handleChange(COLUMNS.DEBT_RETURNS.DATE, e.target.value)}
          error={errors[COLUMNS.DEBT_RETURNS.DATE]}
          required
        />

        <Textarea
          label="Notes"
          value={formData[COLUMNS.DEBT_RETURNS.NOTES]}
          onChange={(e) => handleChange(COLUMNS.DEBT_RETURNS.NOTES, e.target.value)}
          placeholder="Payment notes (optional)"
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
