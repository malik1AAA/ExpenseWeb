import { useState, useEffect } from 'react';
import { Modal, Input, Select, Textarea, Button } from '../common';
import { COLUMNS, DEBT_DIRECTION, DEBT_CATEGORY } from '../../config/excelSchema';
import { getCurrentDate } from '../../utils/dateUtils';
import { Search, UserPlus } from 'lucide-react';

/**
 * DebtForm - Modal form for adding/editing debts
 */
export default function DebtForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  debt = null,
  people = [],
  onAddPerson,
  defaultDirection = DEBT_DIRECTION.LENT
}) {
  const [formData, setFormData] = useState({
    [COLUMNS.DEBTS.PERSON]: '',
    [COLUMNS.DEBTS.PERSON_ID]: '',
    [COLUMNS.DEBTS.DEBT_CATEGORY]: DEBT_CATEGORY.CASH,
    [COLUMNS.DEBTS.DIRECTION]: defaultDirection,
    [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: '',
    [COLUMNS.DEBTS.DATE]: '',
    [COLUMNS.DEBTS.DUE_DATE]: '',
    [COLUMNS.DEBTS.NOTES]: '',
  });

  const [errors, setErrors] = useState({});
  const [personSearch, setPersonSearch] = useState('');
  const [isPersonListOpen, setIsPersonListOpen] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (debt) {
      setFormData({
        [COLUMNS.DEBTS.PERSON]: debt[COLUMNS.DEBTS.PERSON] || '',
        [COLUMNS.DEBTS.PERSON_ID]: debt[COLUMNS.DEBTS.PERSON_ID] || '',
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
        [COLUMNS.DEBTS.PERSON_ID]: '',
        [COLUMNS.DEBTS.DEBT_CATEGORY]: DEBT_CATEGORY.CASH,
        [COLUMNS.DEBTS.DIRECTION]: defaultDirection,
        [COLUMNS.DEBTS.ORIGINAL_AMOUNT]: '',
        [COLUMNS.DEBTS.DATE]: getCurrentDate(),
        [COLUMNS.DEBTS.DUE_DATE]: '',
        [COLUMNS.DEBTS.NOTES]: '',
      });
    }
    setPersonSearch('');
    setIsPersonListOpen(false);
    setErrors({});
  }, [debt, isOpen, defaultDirection]);

  const validate = () => {
    const newErrors = {};

    if (!formData[COLUMNS.DEBTS.PERSON_ID]) {
      newErrors[COLUMNS.DEBTS.PERSON_ID] = 'Select a person';
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

  const activePeople = people.filter(person =>
    person.is_active || person.id === formData[COLUMNS.DEBTS.PERSON_ID]
  );
  const matchingPeople = activePeople.filter(person =>
    person.name.toLowerCase().includes(personSearch.trim().toLowerCase())
  );
  const selectedPerson = people.find(person => person.id === formData[COLUMNS.DEBTS.PERSON_ID]);

  const selectPerson = (person) => {
    setFormData(current => ({
      ...current,
      [COLUMNS.DEBTS.PERSON_ID]: person.id,
      [COLUMNS.DEBTS.PERSON]: person.name,
    }));
    setPersonSearch(person.name);
    setIsPersonListOpen(false);
    setErrors(current => ({ ...current, [COLUMNS.DEBTS.PERSON_ID]: undefined }));
  };

  const handleAddPerson = async () => {
    if (!onAddPerson) return;
    try {
      const person = await onAddPerson();
      if (person) selectPerson(person);
    } catch (error) {
      setErrors(current => ({ ...current, [COLUMNS.DEBTS.PERSON_ID]: error.message }));
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
        <div className="relative">
          <label htmlFor="debt-person-search" className="block text-sm font-medium text-surface-700 mb-2">
            Person <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              id="debt-person-search"
              role="combobox"
              aria-expanded={isPersonListOpen}
              aria-controls="debt-person-options"
              aria-autocomplete="list"
              autoComplete="off"
              className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors[COLUMNS.DEBTS.PERSON_ID] ? 'border-red-500' : 'border-surface-300'}`}
              value={isPersonListOpen ? personSearch : selectedPerson?.name || personSearch}
              onChange={event => {
                setPersonSearch(event.target.value);
                setIsPersonListOpen(true);
                if (formData[COLUMNS.DEBTS.PERSON_ID]) {
                  handleChange(COLUMNS.DEBTS.PERSON_ID, '');
                  handleChange(COLUMNS.DEBTS.PERSON, '');
                }
              }}
              onFocus={() => {
                setPersonSearch(selectedPerson?.name || '');
                setIsPersonListOpen(true);
              }}
              onBlur={() => window.setTimeout(() => setIsPersonListOpen(false), 120)}
              placeholder="Search active people"
              required={!formData[COLUMNS.DEBTS.PERSON_ID]}
            />
          </div>
          {errors[COLUMNS.DEBTS.PERSON_ID] && (
            <p className="mt-1 text-sm text-red-600" role="alert">{errors[COLUMNS.DEBTS.PERSON_ID]}</p>
          )}
          {isPersonListOpen && (
            <div id="debt-person-options" role="listbox" className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-lg">
              {matchingPeople.map(person => (
                <button
                  type="button"
                  role="option"
                  aria-selected={person.id === formData[COLUMNS.DEBTS.PERSON_ID]}
                  key={person.id}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectPerson(person)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-50"
                >
                  {person.name}{!person.is_active ? ' (Inactive — existing debt)' : ''}
                </button>
              ))}
              {matchingPeople.length === 0 && (
                <p className="px-3 py-2 text-sm text-surface-500">No matching active people.</p>
              )}
              {onAddPerson && (
                <button
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={handleAddPerson}
                  className="flex w-full items-center gap-2 border-t border-surface-100 px-3 py-2 text-left text-sm font-medium text-primary-700 hover:bg-primary-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Add a person
                </button>
              )}
            </div>
          )}
        </div>

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
