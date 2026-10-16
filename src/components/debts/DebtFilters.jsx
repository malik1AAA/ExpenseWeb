import { Search } from 'lucide-react';
import { DEBT_DIRECTION } from '../../config/excelSchema';

/**
 * DebtFilters component for filtering debts
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback when filter changes
 */
export default function DebtFilters({ filters, onFilterChange }) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Active', label: 'Active' },
    { value: 'Partial', label: 'Partial' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Paid', label: 'Paid' },
  ];

  const directionOptions = [
    { value: 'all', label: 'All Directions' },
    { value: DEBT_DIRECTION.LENT, label: 'Lent' },
    { value: DEBT_DIRECTION.BORROWED, label: 'Borrowed' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Person */}
        <div className="relative">
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Search Person
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by person..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Direction Filter */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Direction
          </label>
          <select
            value={filters.direction || 'all'}
            onChange={(e) => onFilterChange('direction', e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {directionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.search || filters.direction !== 'all' || filters.status !== 'all' || filters.startDate || filters.endDate) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              onFilterChange('search', '');
              onFilterChange('direction', 'all');
              onFilterChange('status', 'all');
              onFilterChange('startDate', '');
              onFilterChange('endDate', '');
            }}
            className="px-4 py-2 text-sm text-surface-600 hover:text-surface-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
