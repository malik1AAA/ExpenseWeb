/**
 * SummaryStats - Grid of summary statistics for reports
 */
function SummaryStats({ stats = [] }) {
  const defaultStats = [
    { label: 'Avg. Daily Spending', value: '$0.00' },
    { label: 'Highest Expense', value: '$0.00' },
    { label: 'Total Transactions', value: '0' },
    { label: 'Top Category', value: '—' },
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-6">
      <h3 className="text-lg font-semibold text-surface-800 mb-4">
        Summary Statistics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {displayStats.map((stat) => (
          <div key={stat.label} className="text-center p-4 bg-surface-50 rounded-lg">
            <p className="text-xl font-bold text-surface-800">{stat.value}</p>
            <p className="text-xs text-surface-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SummaryStats;
