# Calculation Service Implementation

## Overview

The `calculationService.js` provides pure functions for financial calculations. All functions are stateless, don't mutate input data, and handle edge cases safely.

## Core Functions

### 1. **getTotalExpenses(expenses)**
Returns the sum of all expense amounts.

```javascript
const total = getTotalExpenses(expenses);
// Returns: number (0 if empty or invalid)
```

### 2. **getExpensesForMonth(expenses, year, month)**
Filters expenses for a specific month.

```javascript
const monthExpenses = getExpensesForMonth(expenses, 2024, 0); // January 2024
// Returns: array of expense objects
```

**Parameters:**
- `year`: Full year (e.g., 2024)
- `month`: 0-11 (0 = January, 11 = December)

### 3. **getMonthlyTotal(expenses, year, month)**
Returns total amount for a specific month.

```javascript
const total = getMonthlyTotal(expenses, 2024, 0);
// Returns: number
```

### 4. **getAnnualTotal(expenses, year)**
Returns total amount for a specific year.

```javascript
const total = getAnnualTotal(expenses, 2024);
// Returns: number
```

### 5. **getCategoryTotals(expenses, year, month)**
Returns totals grouped by category for a specific month.

```javascript
const totals = getCategoryTotals(expenses, 2024, 0);
// Returns: { "food": 500, "transport": 200, ... }
```

### 6. **getAnnualCategoryTotals(expenses, year)**
Returns totals grouped by category for a specific year.

```javascript
const totals = getAnnualCategoryTotals(expenses, 2024);
// Returns: { "food": 6000, "transport": 2400, ... }
```

### 7. **getMonthlyTotalsForYear(expenses, year)**
Returns monthly totals for all 12 months of a year.

```javascript
const monthlyTotals = getMonthlyTotalsForYear(expenses, 2024);
// Returns: [
//   { month: 0, total: 1500 },  // January
//   { month: 1, total: 1200 },  // February
//   ...
//   { month: 11, total: 1800 }  // December
// ]
```

**Use case:** Perfect for chart data showing monthly trends.

### 8. **getHighestSpendingCategory(expenses, year, month)**
Returns the category with highest spending for a specific month.

```javascript
const highest = getHighestSpendingCategory(expenses, 2024, 0);
// Returns: { category: "food", total: 500 } or null if no data
```

### 9. **getAverageMonthlySpending(expenses, year)**
Returns average monthly spending for a year (divides by 12).

```javascript
const average = getAverageMonthlySpending(expenses, 2024);
// Returns: number
```

### 10. **getExpenseCount(expenses)**
Returns the count of expenses.

```javascript
const count = getExpenseCount(expenses);
// Returns: number
```

## Helper Functions

### **getAvailableYears(expenses)**
Returns sorted array of unique years from expenses (descending).

```javascript
const years = getAvailableYears(expenses);
// Returns: [2024, 2023, 2022]
```

### **getCurrentYearMonth()**
Returns current year and month.

```javascript
const { year, month } = getCurrentYearMonth();
// Returns: { year: 2024, month: 0 }
```

### **getMonthName(month, locale)**
Returns full month name.

```javascript
const name = getMonthName(0); // "January"
const nameEs = getMonthName(0, 'es-ES'); // "enero"
```

### **getShortMonthName(month, locale)**
Returns abbreviated month name.

```javascript
const name = getShortMonthName(0); // "Jan"
```

## Design Principles

### 1. **Pure Functions**
- No side effects
- Don't mutate input arrays
- Same input always produces same output

### 2. **Safe Defaults**
- Empty arrays return 0 or empty objects
- Invalid dates are filtered out
- Missing amounts treated as 0

### 3. **Schema-Aware**
- Uses `COLUMNS.EXPENSES.DATE`, `AMOUNT`, `CATEGORY` from schema
- Consistent field access across the application

### 4. **Date Handling**
- Uses `date-fns` for reliable date parsing
- ISO string format (YYYY-MM-DD)
- Validates dates before processing

## Integration with useFinance Hook

The `useFinance` hook uses these functions to provide computed values:

```javascript
const {
  totalExpenses,        // getTotalExpenses(expenses)
  categoryBreakdown,    // getCategoryTotals(expenses, year, month)
  topCategories,        // Top 5 from getCategoryTotals
  recentExpenses,       // Sorted by date
} = useFinance();
```

## Usage Examples

### Dashboard Cards
```javascript
const { totalExpenses } = useFinance();
// Display: "Total Expenses: $5,230.00"
```

### Monthly Chart
```javascript
const monthlyTotals = getMonthlyTotalsForYear(expenses, 2024);
// Pass to Recharts for visualization
```

### Category Breakdown
```javascript
const categoryTotals = getCategoryTotals(expenses, 2024, 0);
// Display pie chart or list
```

### Year-over-Year Comparison
```javascript
const total2024 = getAnnualTotal(expenses, 2024);
const total2023 = getAnnualTotal(expenses, 2023);
const change = ((total2024 - total2023) / total2023) * 100;
```

## Testing Considerations

All functions can be tested independently:

```javascript
// Test empty data
expect(getTotalExpenses([])).toBe(0);

// Test normal data
const expenses = [
  { Date: '2024-01-15', Amount: 100, Category: 'food' },
  { Date: '2024-01-20', Amount: 50, Category: 'transport' },
];
expect(getMonthlyTotal(expenses, 2024, 0)).toBe(150);

// Test invalid dates
const badExpenses = [
  { Date: 'invalid', Amount: 100 },
];
expect(getTotalExpenses(badExpenses)).toBe(0);
```

## Performance Notes

- All functions are O(n) where n is the number of expenses
- `useMemo` in components prevents recalculation on every render
- For large datasets (>10,000 expenses), consider:
  - Pre-calculating monthly totals
  - Caching results
  - Virtual scrolling for lists

## Future Enhancements

Potential additions:
- `getMedianExpense(expenses, year, month)` - Median expense amount
- `getExpenseTrend(expenses, months)` - Trend analysis
- `getBudgetVariance(actual, budget)` - Budget comparison
- `getCategoryGrowth(expenses, category, months)` - Category growth rate
