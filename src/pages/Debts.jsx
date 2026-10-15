import { Plus, CreditCard, AlertCircle, CheckCircle2, Clock } from "lucide-react";

function Debts() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Debts</h2>
          <p className="text-surface-500 mt-1">
            Track loans, credit cards, and money owed
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Debt
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">$0.00</p>
              <p className="text-sm text-surface-500">Total Debt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">$0.00</p>
              <p className="text-sm text-surface-500">Due This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">0</p>
              <p className="text-sm text-surface-500">Paid Off</p>
            </div>
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200">
          <h3 className="text-lg font-semibold text-surface-800">Active Debts</h3>
        </div>
        <div className="p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-surface-300" />
            </div>
            <h3 className="text-lg font-medium text-surface-700 mb-1">
              No debts tracked
            </h3>
            <p className="text-surface-400 text-sm max-w-sm">
              Keep track of your loans, credit cards, and money owed to others.
              Add your first debt to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">
              Debt Management Tip
            </h4>
            <p className="text-sm text-amber-600 mt-1">
              Track all your debts in one place to stay on top of payments and
              avoid late fees. You can import debt schedules from Excel files.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Debts;
