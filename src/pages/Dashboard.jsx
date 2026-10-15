import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from "lucide-react";

function Dashboard() {
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
          value="$0.00"
          change="+0%"
          trend="up"
          icon={<Wallet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Income"
          value="$0.00"
          change="+0%"
          trend="up"
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Expenses"
          value="$0.00"
          change="+0%"
          trend="down"
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          title="Savings"
          value="$0.00"
          change="+0%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Charts Area Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-800">
              Spending Overview
            </h3>
            <PieChart className="w-5 h-5 text-surface-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">
                Chart will appear here after adding expenses
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-surface-800">
              Monthly Trends
            </h3>
            <TrendingUp className="w-5 h-5 text-surface-400" />
          </div>
          <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
            <div className="text-center">
              <TrendingDown className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">
                Trends will appear here after adding data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Placeholder */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Recent Transactions
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-200 animate-pulse"></div>
                <div>
                  <div className="h-4 w-32 bg-surface-200 rounded animate-pulse"></div>
                  <div className="h-3 w-20 bg-surface-200 rounded mt-1 animate-pulse"></div>
                </div>
              </div>
              <div className="h-4 w-16 bg-surface-200 rounded animate-pulse"></div>
            </div>
          ))}
          <div className="text-center py-4">
            <p className="text-surface-400 text-sm">
              No transactions yet. Start by importing your Excel data or adding expenses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <span
          className={`text-xs font-medium flex items-center gap-0.5 ${
            trend === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {change}
        </span>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
}

export default Dashboard;
