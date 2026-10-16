import { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import {
  getMonthlyTotal,
  getExpenseCount,
  getAverageMonthlySpending,
  findHighestExpense,
  getCategoryTotals,
  getExpensesForMonth,
  getCurrentYearMonth,
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
} from '../components/reports';

export default function Reports() {
  const { expenses, getCategoryName, getCategoryColor } = useFinance();

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Get expenses for the selected month
  const monthExpenses = getExpensesForMonth(expenses, selectedYear, selectedMonth);

  // Calculate summary statistics using calculationService
  const total = getMonthlyTotal(expenses, selectedYear, selectedMonth);
  const count = getExpenseCount(monthExpenses);
  const average = getAverageMonthlySpending(expenses, selectedYear) / 12; // Monthly average
  const highestExpense = findHighestExpense(monthExpenses);
  const largest = highestExpense ? parseFloat(highestExpense[COLUMNS.EXPENSES.AMOUNT]) : 0;

  // Get category breakdown
  const categoryTotals = getCategoryTotals(expenses, selectedYear, selectedMonth);
  const categoryData = Object.entries(categoryTotals).map(([category, total]) => ({
    category,
    total,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900">Monthly Reports</h1>
        <p className="text-surface-600 mt-1">
          Detailed analysis of your monthly spending
        </p>
      </div>

      {/* Period Selector */}
      <ReportPeriodSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        expenses={expenses}
      />

      {/* Summary Stats */}
      <ReportSummary total={total} count={count} average={average} largest={largest} />

      {/* Charts */}
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

      {/* Category Breakdown Table */}
      <CategoryBreakdown
        categoryData={categoryData}
        total={total}
        getCategoryName={getCategoryName}
      />

      {/* Detailed Expense Table */}
      <ReportExpenseTable
        expenses={monthExpenses}
        getCategoryName={getCategoryName}
      />
    </div>
  );
}
