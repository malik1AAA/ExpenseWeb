import { Plus, AlertCircle } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button } from '../components/common';
import { DebtSummaryCards, DebtList } from '../components/debts';

function Debts() {
  const { totalDebt, activeDebts } = useFinance();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Debts"
        description="Track loans, credit cards, and money owed"
      >
        <Button variant="primary" icon={Plus}>
          Add Debt
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <DebtSummaryCards
        totalDebt={totalDebt}
        dueThisMonth={0}
        paidOff={0}
      />

      {/* Debts List */}
      <DebtList debts={activeDebts} />

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
