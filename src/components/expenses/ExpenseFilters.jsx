import { Search, Filter } from 'lucide-react';
import { getCategoryOptions } from '../../data/sampleData';

/**
 * ExpenseFilters - Filter bar for expenses page
 */
function ExpenseFilters({ searchQuery, onSearchChange, category, onCategoryChange, period, onPeriodChange }) {
  const categories = getCategoryOptions();

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={category || 'all'}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          className="px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={period || 'month'}
          onChange={(e) => onPeriodChange?.(e.target.value)}
          className="px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="month">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 border border-surface-200 rounded-lg text-sm text-surface-600 hover:bg-surface-50 transition-colors">
          <Filter className="w-4 h-4" />
          More Filters
        </button>
      </div>
    </div>
  );
}

export default ExpenseFilters;
