import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName, getAvailableYears, getCurrentYearMonth } from '../../services/calculationService';

/**
 * MonthYearSelector - Component for selecting month and year
 */
export default function MonthYearSelector({ 
  selectedYear, 
  selectedMonth, 
  onYearChange, 
  onMonthChange,
  expenses = [] 
}) {
  const availableYears = getAvailableYears(expenses);
  const currentYear = getCurrentYearMonth().year;
  
  // If no years available, show current year and a few years around it
  const years = availableYears.length > 0 
    ? availableYears 
    : [currentYear - 1, currentYear, currentYear + 1];

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: getMonthName(i),
  }));

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-surface-600" />
          </button>
          
          <div className="flex items-center gap-2">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="px-3 py-2 border border-surface-200 rounded-lg text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="px-3 py-2 border border-surface-200 rounded-lg text-sm font-medium text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-surface-600" />
          </button>
        </div>

        {/* Current selection display */}
        <div className="text-sm text-surface-600">
          <span className="font-medium">{getMonthName(selectedMonth)} {selectedYear}</span>
        </div>
      </div>
    </div>
  );
}
