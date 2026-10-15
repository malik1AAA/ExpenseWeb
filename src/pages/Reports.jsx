import { BarChart3, Calendar, Download, FileSpreadsheet } from "lucide-react";

function Reports() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Reports</h2>
          <p className="text-surface-500 mt-1">
            Analyze your spending patterns and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-surface-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Period:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["This Week", "This Month", "Last Month", "This Quarter", "This Year"].map(
              (period) => (
                <button
                  key={period}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    period === "This Month"
                      ? "bg-primary-100 text-primary-700"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
                >
                  {period}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-800 mb-4">
            Category Breakdown
          </h3>
          <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">
                Add expenses to see category breakdown
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="bg-white rounded-xl border border-surface-200 p-6">
          <h3 className="text-lg font-semibold text-surface-800 mb-4">
            Monthly Comparison
          </h3>
          <div className="h-64 flex items-center justify-center bg-surface-50 rounded-lg border-2 border-dashed border-surface-200">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-surface-300 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">
                Monthly data will appear here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-lg font-semibold text-surface-800 mb-4">
          Summary Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Avg. Daily Spending", value: "$0.00" },
            { label: "Highest Expense", value: "$0.00" },
            { label: "Total Transactions", value: "0" },
            { label: "Top Category", value: "—" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-surface-50 rounded-lg">
              <p className="text-xl font-bold text-surface-800">{stat.value}</p>
              <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Excel Import Info */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-primary-800">
              Excel Data Source
            </h4>
            <p className="text-sm text-primary-600 mt-1">
              Import your expense data from Excel files to generate detailed reports
              with charts and insights. Supported formats: .xlsx, .xls
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
