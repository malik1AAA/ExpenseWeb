import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { formatCurrency } from '../utils/currencyUtils';
import { StatCard } from '../components/common';
import { SpendingChart, TrendsChart, RecentTransactions } from '../components/dashboard';

function Dashboard() {
  const { balance, totalIncome, totalExpenses, recentTransactions } = useFinance();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Dashboard</h2>
        <p className="text-surface-500 mt-1">
          Overview of your financial activity
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(balance)}
          change="+0%"
          trend="up"
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Income"
          value={formatCurrency(totalIncome)}
          change="+0%"
          trend="up"
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          change="+0%"
          trend="down"
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Savings"
          value={formatCurrency(totalIncome - totalExpenses)}
          change="+0%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <TrendsChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentTransactions} />
    </div>
  );
}

export default Dashboard;
