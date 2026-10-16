# Annual Reports Implementation

## Overview
The Annual Reports section provides comprehensive year-long financial analysis with summary statistics, visualizations, and detailed breakdowns.

## Features Implemented

### 1. Year Selection
- Simple year selector dropdown
- Shows available years from expense data
- Defaults to current year
- Automatically updates all calculations when changed

### 2. Summary Statistics (5 Cards)
- **Annual Total Spending**: Total expenses for the entire year
- **Average Monthly Spending**: Mean monthly expense (total / 12)
- **Highest Spending Month**: Month with maximum spending (shows month name and amount)
- **Lowest Spending Month**: Month with minimum spending (excludes zero months)
- **Highest Spending Category**: Category with most spending (shows category name and amount)

### 3. Visualizations

#### Monthly Spending Chart (Bar/Line)
- Shows all 12 months (January - December)
- Each bar/point represents total spending for that month
- Handles months with zero spending correctly
- Interactive tooltips with formatted currency
- Toggle between bar and line chart (configurable)

#### Annual Category Distribution (Donut Chart)
- Pie/donut chart showing category breakdown for the year
- Color-coded by category
- Sorted by amount (descending)
- Interactive tooltips
- Legend showing all categories

### 4. Annual Category Breakdown Table
- Detailed table showing each category
- Columns: Category, Annual Amount, Percentage
- Sorted by amount (descending)
- Shows total row at bottom
- Percentage calculated from annual total

### 5. Monthly Summary Table
- Complete breakdown of all 12 months
- Columns: Month, Total Expenses, Number of Transactions, Average Expense
- Shows all months even if they have zero spending
- Average expense shows '-' for months with no transactions
- Sorted chronologically (January - December)

## Architecture

### Components Created
1. **YearSelector** - Simple year selection dropdown
2. **AnnualReportSummary** - 5 summary statistic cards
3. **AnnualMonthlyChart** - Monthly spending bar/line chart
4. **AnnualCategoryChart** - Annual category donut chart
5. **AnnualCategoryBreakdown** - Category breakdown table
6. **AnnualMonthlyTable** - Monthly summary table

### Services Enhanced
Added to `calculationService.js`:
- `getHighestSpendingMonth()` - Find month with highest spending
- `getLowestSpendingMonth()` - Find month with lowest spending (excluding zeros)
- `getHighestSpendingCategoryForYear()` - Find top category for the year
- `getMonthlySummaryForYear()` - Get monthly summary data (total, count, average)

### Data Flow
```
FinanceContext (expenses)
    ↓
Reports Page (Annual Tab)
    ↓
    ├─→ getAnnualTotal() → annualTotal
    ├─→ getAverageMonthlySpending() → annualAverage
    ├─→ getHighestSpendingMonth() → highestMonth
    ├─→ getLowestSpendingMonth() → lowestMonth
    ├─→ getHighestSpendingCategoryForYear() → highestCategory
    ├─→ getAnnualCategoryTotals() → annualCategoryData
    └─→ getMonthlySummaryForYear() → monthlySummary
```

## Key Design Decisions

### 1. Zero Spending Handling
- **Monthly Chart**: Shows all 12 months, including those with $0 spending
- **Monthly Table**: Displays '-' for average expense when count is 0
- **Lowest Month**: Excludes months with zero spending to find actual lowest

### 2. Tab-Based Navigation
- Reports page now has two tabs: Monthly and Annual
- Each tab has its own selector and data
- Smooth switching between report types
- Maintains selected year across tabs

### 3. Reusable Components
- All annual components accept data as props
- Can be used independently or within the Reports page
- Consistent styling with monthly report components

### 4. Responsive Design
- Summary cards: 1 column (mobile) → 2 columns (tablet) → 5 columns (desktop)
- Charts: 1 column (mobile/tablet) → 2 columns (desktop)
- Tables: Horizontal scroll on small screens

### 5. No Duplicate Logic
- All calculations in `calculationService.js`
- Components only handle presentation
- Easy to test and maintain

## Usage Example

```jsx
import Reports from './pages/Reports';

// In your router
<Route path="/reports" element={<Reports />} />

// Users can switch between Monthly and Annual tabs
// Annual tab shows comprehensive year-long analysis
```

## Dependencies
- **Recharts**: For all chart visualizations
- **date-fns**: For date parsing and formatting
- **lucide-react**: For icons (DollarSign, TrendingUp, ArrowUp, ArrowDown, Award)
- **FinanceContext**: For expense data
- **calculationService**: For all calculations

## File Structure
```
src/
├── components/
│   └── reports/
│       ├── YearSelector.jsx (NEW)
│       ├── AnnualReportSummary.jsx (NEW)
│       ├── AnnualMonthlyChart.jsx (NEW)
│       ├── AnnualCategoryChart.jsx (NEW)
│       ├── AnnualCategoryBreakdown.jsx (NEW)
│       ├── AnnualMonthlyTable.jsx (NEW)
│       └── index.js (UPDATED)
├── services/
│   └── calculationService.js (UPDATED - added 4 new functions)
└── pages/
    └── Reports.jsx (UPDATED - added annual report view)
```

## Calculation Functions Added

### getHighestSpendingMonth(expenses, year)
Returns the month with highest spending for a year.
```javascript
{ month: 11, total: 5000 } // December with $5000
```

### getLowestSpendingMonth(expenses, year)
Returns the month with lowest spending (excluding zero months).
```javascript
{ month: 2, total: 150 } // March with $150
```

### getHighestSpendingCategoryForYear(expenses, year)
Returns the category with highest spending for the year.
```javascript
{ category: 'food', total: 12000 }
```

### getMonthlySummaryForYear(expenses, year)
Returns array of 12 objects with monthly summary data.
```javascript
[
  { month: 0, total: 1500, count: 25, average: 60 },
  { month: 1, total: 0, count: 0, average: 0 },
  // ... all 12 months
]
```

## Future Enhancements
Potential additions:
- Year-over-year comparison
- Export annual report to PDF/Excel
- Spending trends across multiple years
- Budget vs actual comparison
- Category growth analysis
- Seasonal spending patterns
- Interactive chart filtering
- Custom date ranges
