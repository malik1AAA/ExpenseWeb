import { Select } from '../common';
import { getAvailableYears } from '../../services/calculationService';

/**
 * YearSelector - Simple year selector for annual reports
 */
export default function YearSelector({ selectedYear, onYearChange, expenses = [] }) {
  const availableYears = getAvailableYears(expenses);
  const currentYear = new Date().getFullYear();

  // If no years available, show current year and a few years around it
  const years = availableYears.length > 0
    ? availableYears
    : [currentYear - 1, currentYear, currentYear + 1];

  const yearOptions = years.map((year) => ({
    value: year.toString(),
    label: year.toString(),
  }));

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-surface-600">
          <span className="text-sm font-medium">Year:</span>
        </div>
        <div className="flex-1 max-w-xs">
          <Select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            options={yearOptions}
          />
        </div>
      </div>
    </div>
  );
}
