import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { PageHeader, Button } from '../components/common';
import { ReportPeriodSelector, SummaryStats, CategoryChart, MonthlyComparisonChart } from '../components/reports';

function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        description="Analyze your spending patterns and trends"
      >
        <Button variant="secondary" icon={Download}>
          Export Report
        </Button>
      </PageHeader>

      {/* Period Selector */}
      <ReportPeriodSelector
        selected={selectedPeriod}
        onSelect={setSelectedPeriod}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart />
        <MonthlyComparisonChart />
      </div>

      {/* Summary Stats */}
      <SummaryStats />

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
