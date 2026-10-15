import { TrendingUp, Wallet, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { formatCurrency } from '../utils/currencyUtils';
import { StatCard } from '../components/common';
import { SpendingChart, TrendsChart, RecentTransactions } from '../components/dashboard';

function Dashboard() {
  const { totalExpenses, recentExpenses } = useFinance();

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
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          change="+0%"
          trend="down"
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(totalExpenses)}
          change="+0%"
          trend="down"
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Categories"
          value="8"
          change="+0%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          title="Transactions"
          value={recentExpenses.length.toString()}
          change="+0%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <TrendsChart />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={recentExpenses} />
    </div>
  );
}

export default Dashboard;
