import { CreditCard } from 'lucide-react';
import EmptyState from '../common/EmptyState';

/**
 * DebtList - List of active debts
 */
function DebtList({ debts = [], onEdit, onDelete }) {
  const hasData = debts && debts.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200">
          <h3 className="text-lg font-semibold text-surface-800">Active Debts</h3>
        </div>
        <EmptyState
          icon={CreditCard}
          title="No debts tracked"
          description="Keep track of your loans, credit cards, and money owed to others. Add your first debt to get started."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-200">
        <h3 className="text-lg font-semibold text-surface-800">Active Debts</h3>
      </div>
      <div className="divide-y divide-surface-100">
        {debts.map((debt) => (
          <div key={debt.id} className="p-4 hover:bg-surface-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-surface-800">{debt.name}</h4>
                <p className="text-xs text-surface-500 mt-0.5">
                  Due: {debt.dueDate} • {debt.interestRate}% APR
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-surface-800">
                  ${debt.remainingAmount?.toLocaleString()}
                </p>
                <p className="text-xs text-surface-500">
                  of ${debt.totalAmount?.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full bg-surface-100 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all"
                style={{
                  width: `${((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DebtList;
