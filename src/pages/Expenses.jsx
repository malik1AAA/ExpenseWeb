import { useState } from 'react';
import { Plus, Upload, Download } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { PageHeader, Button } from '../components/common';
import { ExpenseFilters, ExpenseTable } from '../components/expenses';

function Expenses() {
  const { expenses } = useFinance();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [period, setPeriod] = useState('month');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Expenses"
        description="Track and manage your daily expenses"
      >
        <Button variant="secondary" icon={Upload}>
          Import
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button variant="primary" icon={Plus}>
          Add Expense
        </Button>
      </PageHeader>

      {/* Filters */}
      <ExpenseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Expense Table */}
      <ExpenseTable expenses={expenses} />
    </div>
  );
}

export default Expenses;
