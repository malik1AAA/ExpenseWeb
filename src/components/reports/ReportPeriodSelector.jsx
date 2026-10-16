import { Select } from '../common';
import { getAvailableYears, getMonthName } from '../../services/calculationService';

/**
 * ReportPeriodSelector - Year and month selector for reports
 */
export default function ReportPeriodSelector({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange,
  expenses = []
}) {
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: getMonthName(i),
  }));

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-surface-600">
          <span className="text-sm font-medium">Period:</span>
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="flex-1 min-w-[150px]">
            <Select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              options={monthOptions}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              options={yearOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
