import { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '../common';
import { COLUMNS, DEBT_DIRECTION, DEBT_CATEGORY } from '../../config/excelSchema';
import { getCurrentDate } from '../../utils/dateUtils';

/**
 * DebtForm - Modal form for adding/editing debts
 */
export default function DebtForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  debt = null,
  defaultDirection = DEBT_DIRECTION.LENT
}) {
  const [formData, setFormData] = useState({
    [COLUMNS.DEBTS.PERSON]: '',
    [COLUMNS.DEBTS.DEBT_CATEGORY]: DEBT_CATEGORY.CASH,
    [COLUMNS.DEBTS.DIRECTION]: defaultDirection,
    [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: '',
    [COLUMNS.DEBTS.DATE]: '',
    [COLUMNS.DEBTS.DUE_DATE]: '',
    [COLUMNS.DEBTS.NOTES]: '',
  });

  const [errors, setErrors] = useState({});

  // Populate form when editing
  useEffect(() => {
    if (debt) {
      setFormData({
        [COLUMNS.DEBTS.PERSON]: debt[COLUMNS.DEBTS.PERSON] || '',
        [COLUMNS.DEBTS.DEBT_CATEGORY]: debt[COLUMNS.DEBTS.DEBT_CATEGORY] || DEBT_CATEGORY.CASH,
        [COLUMNS.DEBTS.DIRECTION]: debt[COLUMNS.DEBTS.DIRECTION] || defaultDirection,
        [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]?.toString() || '',
        [COLUMNS.DEBTS.DATE]: debt[COLUMNS.DEBTS.DATE] || '',
        [COLUMNS.DEBTS.DUE_DATE]: debt[COLUMNS.DEBTS.DUE_DATE] || '',
        [COLUMNS.DEBTS.NOTES]: debt[COLUMNS.DEBTS.NOTES] || '',
      });
    } else {
      // Reset form for new debt
      setFormData({
        [COLUMNS.DEBTS.PERSON]: '',
        [COLUMNS.DEBTS.DEBT_CATEGORY]: DEBT_CATEGORY.CASH,
        [COLUMNS.DEBTS.DIRECTION]: defaultDirection,
        [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: '',
        [COLUMNS.DEBTS.DATE]: getCurrentDate(),
        [COLUMNS.DEBTS.DUE_DATE]: '',
        [COLUMNS.DEBTS.NOTES]: '',
      });
    }
    setErrors({});
  }, [debt, isOpen, defaultDirection]);

  const validate = () => {
    const newErrors = {};

    if (!formData[COLUMNS.DEBTS.PERSON].trim()) {
      newErrors[COLUMNS.DEBTS.PERSON] = 'Person is required';
    }

    const amount = parseFloat(formData[COLUMNS.DEBTS.ORIGINAL_AMOUNT]);
    if (!formData[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || isNaN(amount) || amount <= 0) {
      newErrors[COLUMNS.DEBTS.ORIGINAL_AMOUNT] = 'Amount must be greater than 0';
    }

    if (!formData[COLUMNS.DEBTS.DATE]) {
      newErrors[COLUMNS.DEBTS.DATE] = 'Date is required';
    }

    // Due Date is optional - no validation required

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    const debtData = {
      ...formData,
      [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: parseFloat(formData[COLUMNS.DEBTS.ORIGINAL_AMOUNT]),
    };

    try {
      await onSubmit(debtData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is already handled in FinanceContext, just keep the modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Prepare debt category options
  const debtCategoryOptions = [
    { value: DEBT_CATEGORY.CASH, label: 'Cash' },
    { value: DEBT_CATEGORY.FOOD, label: 'Food' },
  ];

  // Prepare direction options
  const directionOptions = [
    { value: DEBT_DIRECTION.LENT, label: 'Lent - Money I should receive back' },
    { value: DEBT_DIRECTION.BORROWED, label: 'Borrowed - Money I need to pay back' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debt ? 'Edit Debt' : 'Add Debt'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Person"
          value={formData[COLUMNS.DEBTS.PERSON]}
          onChange={(e) => handleChange(COLUMNS.DEBTS.PERSON, e.target.value)}
          error={errors[COLUMNS.DEBTS.PERSON]}
          placeholder="e.g., John Doe"
          required
        />

        <div>
          <Select
            label="Direction"
            value={formData[COLUMNS.DEBTS.DIRECTION]}
            onChange={(e) => handleChange(COLUMNS.DEBTS.DIRECTION, e.target.value)}
            options={directionOptions}
            required
          />
          <p className="mt-1 text-xs text-surface-500">
            {formData[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT
              ? 'This debt represents money you should receive back from this person.'
              : 'This debt represents money you need to pay back to this person.'}
          </p>
        </div>

        <Select
          label="Debt Category"
          value={formData[COLUMNS.DEBTS.DEBT_CATEGORY]}
          onChange={(e) => handleChange(COLUMNS.DEBTS.DEBT_CATEGORY, e.target.value)}
          options={debtCategoryOptions}
          required
        />

        <Input
          label="Original Amount"
          type="number"
          step="0.01"
          min="0"
          value={formData[COLUMNS.DEBTS.ORIGINAL_AMOUNT]}
          onChange={(e) => handleChange(COLUMNS.DEBTS.ORIGINAL_AMOUNT, e.target.value)}
          error={errors[COLUMNS.DEBTS.ORIGINAL_AMOUNT]}
          placeholder="0.00"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={formData[COLUMNS.DEBTS.DATE]}
            onChange={(e) => handleChange(COLUMNS.DEBTS.DATE, e.target.value)}
            error={errors[COLUMNS.DEBTS.DATE]}
            required
          />

          <Input
            label="Due Date (Optional)"
            type="date"
            value={formData[COLUMNS.DEBTS.DUE_DATE]}
            onChange={(e) => handleChange(COLUMNS.DEBTS.DUE_DATE, e.target.value)}
            error={errors[COLUMNS.DEBTS.DUE_DATE]}
          />
        </div>

        <Textarea
          label="Notes"
          value={formData[COLUMNS.DEBTS.NOTES]}
          onChange={(e) => handleChange(COLUMNS.DEBTS.NOTES, e.target.value)}
          placeholder="Additional notes (optional)"
        />

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (debt ? 'Update' : 'Add')} Debt
          </Button>
        </div>
      </form>
    </Modal>
  );
}
