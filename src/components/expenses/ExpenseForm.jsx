import { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '../common';
import { COLUMNS, PAYMENT_METHODS } from '../../config/excelSchema';
import { getCurrentDate } from '../../utils/dateUtils';

/**
 * ExpenseForm - Modal form for adding/editing expenses
 */
export default function ExpenseForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  expense = null,
  categories = [] 
}) {
  const [formData, setFormData] = useState({
    [COLUMNS.EXPENSES.DATE]: '',
    [COLUMNS.EXPENSES.DESCRIPTION]: '',
    [COLUMNS.EXPENSES.CATEGORY]: '',
    [COLUMNS.EXPENSES.AMOUNT]: '',
    [COLUMNS.EXPENSES.PAYMENT_METHOD]: '',
    [COLUMNS.EXPENSES.NOTES]: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (expense) {
      setFormData({
        [COLUMNS.EXPENSES.DATE]: expense[COLUMNS.EXPENSES.DATE] || '',
        [COLUMNS.EXPENSES.DESCRIPTION]: expense[COLUMNS.EXPENSES.DESCRIPTION] || '',
        [COLUMNS.EXPENSES.CATEGORY]: expense[COLUMNS.EXPENSES.CATEGORY] || '',
        [COLUMNS.EXPENSES.AMOUNT]: expense[COLUMNS.EXPENSES.AMOUNT]?.toString() || '',
        [COLUMNS.EXPENSES.PAYMENT_METHOD]: expense[COLUMNS.EXPENSES.PAYMENT_METHOD] || '',
        [COLUMNS.EXPENSES.NOTES]: expense[COLUMNS.EXPENSES.NOTES] || '',
      });
    } else {
      // Reset form for new expense
      setFormData({
        [COLUMNS.EXPENSES.DATE]: getCurrentDate(),
        [COLUMNS.EXPENSES.DESCRIPTION]: '',
        [COLUMNS.EXPENSES.CATEGORY]: '',
        [COLUMNS.EXPENSES.AMOUNT]: '',
        [COLUMNS.EXPENSES.PAYMENT_METHOD]: '',
        [COLUMNS.EXPENSES.NOTES]: '',
      });
    }
    setErrors({});
  }, [expense, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData[COLUMNS.EXPENSES.DATE]) {
      newErrors[COLUMNS.EXPENSES.DATE] = 'Date is required';
    }

    if (!formData[COLUMNS.EXPENSES.DESCRIPTION].trim()) {
      newErrors[COLUMNS.EXPENSES.DESCRIPTION] = 'Description is required';
    }

    if (!formData[COLUMNS.EXPENSES.CATEGORY]) {
      newErrors[COLUMNS.EXPENSES.CATEGORY] = 'Category is required';
    }

    const amount = parseFloat(formData[COLUMNS.EXPENSES.AMOUNT]);
    if (!formData[COLUMNS.EXPENSES.AMOUNT] || isNaN(amount) || amount <= 0) {
      newErrors[COLUMNS.EXPENSES.AMOUNT] = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const expenseData = {
      ...formData,
      [COLUMNS.EXPENSES.AMOUNT]: parseFloat(formData[COLUMNS.EXPENSES.AMOUNT]),
    };

    onSubmit(expenseData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Prepare category options
  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...categories.map((cat) => ({
      value: cat[COLUMNS.CATEGORIES.CATEGORY_ID],
      label: cat[COLUMNS.CATEGORIES.CATEGORY_NAME],
    })),
  ];

  // Prepare payment method options
  const paymentMethodOptions = [
    { value: '', label: 'Select payment method...' },
    { value: PAYMENT_METHODS.CASH, label: PAYMENT_METHODS.CASH },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: PAYMENT_METHODS.BANK_TRANSFER },
    { value: PAYMENT_METHODS.CREDIT_CARD, label: PAYMENT_METHODS.CREDIT_CARD },
    { value: PAYMENT_METHODS.DEBIT_CARD, label: PAYMENT_METHODS.DEBIT_CARD },
    { value: PAYMENT_METHODS.OTHER, label: PAYMENT_METHODS.OTHER },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense' : 'Add Expense'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={formData[COLUMNS.EXPENSES.DATE]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.DATE, e.target.value)}
          error={errors[COLUMNS.EXPENSES.DATE]}
          required
        />

        <Input
          label="Description"
          value={formData[COLUMNS.EXPENSES.DESCRIPTION]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.DESCRIPTION, e.target.value)}
          error={errors[COLUMNS.EXPENSES.DESCRIPTION]}
          placeholder="e.g., Grocery shopping"
          required
        />

        <Select
          label="Category"
          value={formData[COLUMNS.EXPENSES.CATEGORY]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.CATEGORY, e.target.value)}
          options={categoryOptions}
          error={errors[COLUMNS.EXPENSES.CATEGORY]}
          required
        />

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={formData[COLUMNS.EXPENSES.AMOUNT]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.AMOUNT, e.target.value)}
          error={errors[COLUMNS.EXPENSES.AMOUNT]}
          placeholder="0.00"
          required
        />

        <Select
          label="Payment Method"
          value={formData[COLUMNS.EXPENSES.PAYMENT_METHOD]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.PAYMENT_METHOD, e.target.value)}
          options={paymentMethodOptions}
        />

        <Textarea
          label="Notes"
          value={formData[COLUMNS.EXPENSES.NOTES]}
          onChange={(e) => handleChange(COLUMNS.EXPENSES.NOTES, e.target.value)}
          placeholder="Additional notes (optional)"
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            {expense ? 'Update' : 'Add'} Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
