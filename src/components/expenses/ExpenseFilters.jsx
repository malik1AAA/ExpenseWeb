import { Search } from 'lucide-react';
import { Select } from '../common';
import { COLUMNS, PAYMENT_METHODS } from '../../config/excelSchema';
import { getAvailableYears, getMonthName } from '../../services/calculationService';

/**
 * ExpenseFilters - Filter controls for expenses
 */
export default function ExpenseFilters({ 
  filters, 
  onFilterChange, 
  categories = [],
  expenses = []
}) {
  const availableYears = getAvailableYears(expenses);

  // Month options (0-11)
  const monthOptions = [
    { value: '', label: 'All Months' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: getMonthName(i),
    })),
  ];

  // Year options
  const yearOptions = [
    { value: '', label: 'All Years' },
    ...availableYears.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
  ];

  // Category options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat) => ({
      value: cat[COLUMNS.CATEGORIES.CATEGORY_ID],
      label: cat[COLUMNS.CATEGORIES.CATEGORY_NAME],
    })),
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods' },
    { value: PAYMENT_METHODS.CASH, label: PAYMENT_METHODS.CASH },
    { value: PAYMENT_METHODS.BANK_TRANSFER, label: PAYMENT_METHODS.BANK_TRANSFER },
    { value: PAYMENT_METHODS.CREDIT_CARD, label: PAYMENT_METHODS.CREDIT_CARD },
    { value: PAYMENT_METHODS.DEBIT_CARD, label: PAYMENT_METHODS.DEBIT_CARD },
    { value: PAYMENT_METHODS.OTHER, label: PAYMENT_METHODS.OTHER },
  ];

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search description..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Month */}
        <Select
          value={filters.month}
          onChange={(e) => onFilterChange('month', e.target.value)}
          options={monthOptions}
        />

        {/* Year */}
        <Select
          value={filters.year}
          onChange={(e) => onFilterChange('year', e.target.value)}
          options={yearOptions}
        />

        {/* Category */}
        <Select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          options={categoryOptions}
        />

        {/* Payment Method */}
        <Select
          value={filters.paymentMethod}
          onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
          options={paymentMethodOptions}
        />
      </div>
    </div>
  );
}
