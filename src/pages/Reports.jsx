import { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import {
  getMonthlyTotal,
  getExpenseCount,
  getAverageMonthlySpending,
  getAverageDailyExpense,
  findHighestExpense,
  getCategoryTotals,
  getExpensesForMonth,
  getCurrentYearMonth,
  getAnnualTotal,
  getHighestSpendingMonth,
  getLowestSpendingMonth,
  getHighestSpendingCategoryForYear,
  getAnnualCategoryTotals,
  getExpensesForYear,
} from '../services/calculationService';
import { COLUMNS } from '../config/excelSchema';
import {
  ReportPeriodSelector,
  ReportSummary,
  CategoryBreakdown,
  CategoryPieChart,
  CategoryBarChart,
  DailySpendingChart,
  ReportExpenseTable,
  YearSelector,
  AnnualReportSummary,
  AnnualMonthlyChart,
  AnnualCategoryChart,
  AnnualCategoryBreakdown,
  AnnualMonthlyTable,
} from '../components/reports';

export default function Reports() {
  const { expenses, getCategoryName, getCategoryColor } = useFinance();

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportType, setReportType] = useState('monthly'); // 'monthly' or 'annual'

  // Monthly Report Data
  const monthExpenses = getExpensesForMonth(expenses, selectedYear, selectedMonth);
  const total = getMonthlyTotal(expenses, selectedYear, selectedMonth);
  const count = getExpenseCount(monthExpenses);
  const average = getAverageDailyExpense(expenses, selectedYear, selectedMonth);
  const highestExpense = findHighestExpense(monthExpenses);
  const largest = highestExpense ? parseFloat(highestExpense[COLUMNS.EXPENSES.AMOUNT]) : 0;
  const categoryTotals = getCategoryTotals(expenses, selectedYear, selectedMonth);
  const categoryData = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total,
  }));

  // Annual Report Data
  const annualTotal = getAnnualTotal(expenses, selectedYear);
  const annualExpenses = getExpensesForYear(expenses, selectedYear);
  const annualCount = getExpenseCount(annualExpenses);
  const annualAverage = getAverageMonthlySpending(expenses, selectedYear);
  
  // Calculate average daily expense for the year
  // For past years: divide by 365 or 366 (leap year)
  // For current year: divide by days elapsed so far
  const isCurrentYear = selectedYear === currentYear;
  let annualDailyAverage = 0;
  
  if (isCurrentYear) {
    // For current year: calculate from Jan 1 to today
    const today = new Date();
    const startOfYear = new Date(selectedYear, 0, 1);
    const daysElapsed = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    annualDailyAverage = daysElapsed > 0 ? annualTotal / daysElapsed : 0;
  } else if (selectedYear < currentYear) {
    // For past years: divide by days in year
    const isLeapYear = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    annualDailyAverage = annualTotal / daysInYear;
  }
  // For future years, annualDailyAverage remains 0
  
  const highestMonth = getHighestSpendingMonth(expenses, selectedYear);
  const lowestMonth = getLowestSpendingMonth(expenses, selectedYear);
  const highestCategory = getHighestSpendingCategoryForYear(expenses, selectedYear);
  const annualCategoryTotals = getAnnualCategoryTotals(expenses, selectedYear);
  const annualCategoryData = Object.entries(annualCategoryTotals).map(([category, total]) => ({
    category,
    total,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900">Reports</h1>
        <p className="text-surface-600 mt-1">
          {reportType === 'monthly' 
            ? 'Detailed analysis of your monthly spending' 
            : 'Comprehensive annual spending analysis'}
        </p>
      </div>

      {/* Report Type Tabs */}
      <div className="bg-white rounded-xl border border-surface-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('monthly')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reportType === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setReportType('annual')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              reportType === 'annual'
                ? 'bg-primary-600 text-white'
                : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
            }`}
          >
            Annual Report
          </button>
        </div>
      </div>

      {/* Conditional Rendering Based on Report Type */}
      {reportType === 'monthly' ? (
        <>
          {/* Monthly Period Selector */}
          <ReportPeriodSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            expenses={expenses}
          />

          {/* Monthly Summary Stats */}
          <ReportSummary total={total} count={count} average={average} largest={largest} />

          {/* Monthly Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryPieChart
              categoryData={categoryData}
              getCategoryName={getCategoryName}
              getCategoryColor={getCategoryColor}
            />
            <CategoryBarChart
              categoryData={categoryData}
              getCategoryName={getCategoryName}
              getCategoryColor={getCategoryColor}
            />
          </div>

          {/* Daily Spending Chart */}
          <DailySpendingChart
            expenses={expenses}
            year={selectedYear}
            month={selectedMonth}
          />

          {/* Monthly Category Breakdown Table */}
          <CategoryBreakdown
            categoryData={categoryData}
            total={total}
            getCategoryName={getCategoryName}
          />

          {/* Monthly Expense Details Table */}
          <ReportExpenseTable
            expenses={monthExpenses}
            getCategoryName={getCategoryName}
          />
        </>
      ) : (
        <>
          {/* Annual Year Selector */}
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            expenses={expenses}
          />

          {/* Annual Summary Stats */}
          <AnnualReportSummary
            year={selectedYear}
            annualTotal={annualTotal}
            annualCount={annualCount}
            averageDaily={annualDailyAverage}
            highestMonth={highestMonth}
            lowestMonth={lowestMonth}
            highestCategory={highestCategory}
            getMonthName={(month) => {
              const date = new Date(2000, month, 1);
              return date.toLocaleString('en-US', { month: 'long' });
            }}
            getCategoryName={getCategoryName}
          />

          {/* Annual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnnualMonthlyChart
              expenses={expenses}
              year={selectedYear}
              chartType="bar"
            />
            <AnnualCategoryChart
              categoryData={annualCategoryData}
              getCategoryName={getCategoryName}
              getCategoryColor={getCategoryColor}
            />
          </div>

          {/* Annual Category Breakdown Table */}
          <AnnualCategoryBreakdown
            categoryData={annualCategoryData}
            total={annualTotal}
            getCategoryName={getCategoryName}
          />

          {/* Annual Monthly Summary Table */}
          <AnnualMonthlyTable
            expenses={expenses}
            year={selectedYear}
          />
        </>
      )}
    </div>
  );
}
