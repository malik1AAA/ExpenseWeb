import { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { getCurrentYearMonth, getMonthlyTotal, getAnnualTotal } from '../services/calculationService';
import {
  SummaryCard,
  MonthYearSelector,
  MonthlySpendingChart,
  CategoryBreakdownChart,
  RecentExpensesList,
  OutstandingDebtsList,
} from '../components/dashboard';
import { formatCurrency } from '../utils/currencyUtils';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { COLUMNS, DEBT_DIRECTION } from '../config/excelSchema';

export default function Dashboard() {
  const {
    expenses,
    debts,
    debtReturns,
    categories,
    getCategoryName,
    getCategoryColor,
    getRemainingDebt,
  } = useFinance();

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Calculate all metrics dynamically
  const monthlySpending = getMonthlyTotal(expenses, selectedYear, selectedMonth);
  const annualSpending = getAnnualTotal(expenses, selectedYear);

  // Calculate money lent and borrowed
  const moneyLent = debts
    .filter((d) => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT)
    .reduce((sum, d) => sum + d[COLUMNS.DEBTS.ORIGINAL_AMOUNT], 0);

  const moneyBorrowed = debts
    .filter((d) => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.BORROWED)
    .reduce((sum, d) => sum + d[COLUMNS.DEBTS.ORIGINAL_AMOUNT], 0);

  // Calculate outstanding receivable and payable
  const outstandingReceivable = debts
    .filter((d) => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.LENT)
    .reduce((sum, d) => sum + getRemainingDebt(d), 0);

  const outstandingPayable = debts
    .filter((d) => d[COLUMNS.DEBTS.DIRECTION] === DEBT_DIRECTION.BORROWED)
    .reduce((sum, d) => sum + getRemainingDebt(d), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900">Dashboard</h1>
        <p className="text-surface-600 mt-1">
          Overview of your financial activity
        </p>
      </div>

      {/* Month/Year Selector */}
      <MonthYearSelector
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        expenses={expenses}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <SummaryCard
          title="This Month's Spending"
          value={formatCurrency(monthlySpending)}
          icon={Wallet}
          color="blue"
        />
        <SummaryCard
          title="This Year's Spending"
          value={formatCurrency(annualSpending)}
          icon={TrendingUp}
          color="purple"
        />
        <SummaryCard
          title="Money Lent"
          value={formatCurrency(moneyLent)}
          icon={ArrowUpRight}
          color="green"
        />
        <SummaryCard
          title="Money Borrowed"
          value={formatCurrency(moneyBorrowed)}
          icon={ArrowDownRight}
          color="red"
        />
        <SummaryCard
          title="Outstanding Receivable"
          value={formatCurrency(outstandingReceivable)}
          icon={ArrowUpRight}
          color="green"
        />
        <SummaryCard
          title="Outstanding Payable"
          value={formatCurrency(outstandingPayable)}
          icon={ArrowDownRight}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlySpendingChart expenses={expenses} year={selectedYear} />
        <CategoryBreakdownChart
          expenses={expenses}
          year={selectedYear}
          month={selectedMonth}
          getCategoryName={getCategoryName}
          getCategoryColor={getCategoryColor}
        />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentExpensesList
          expenses={expenses}
          getCategoryName={getCategoryName}
          limit={5}
        />
        <OutstandingDebtsList
          debts={debts}
          debtReturns={debtReturns}
          getRemainingDebt={getRemainingDebt}
          limit={5}
        />
      </div>
    </div>
  );
}
