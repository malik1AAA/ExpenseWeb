# Debt Statistics Dashboard Feature

## Overview

Added comprehensive debt statistics to the Dashboard with separate cards for "You Should Receive" (Lent) and "You Should Pay" (Borrowed) sections. The feature provides a clear visual breakdown of all debt-related metrics.

## Features Implemented

### 1. Two Main Sections

#### You Should Receive (Lent Debts)
- **Money Lent**: Total original amount of all lent debts
- **Money Returned**: Total amount returned from lent debts
- **Outstanding**: Remaining amount to be received
- **Active Debts**: Count of active lent debts (not fully paid)

#### You Should Pay (Borrowed Debts)
- **Money Borrowed**: Total original amount of all borrowed debts
- **Money Paid Back**: Total amount paid back for borrowed debts
- **Outstanding**: Remaining amount to be paid
- **Active Debts**: Count of active borrowed debts (not fully paid)

### 2. Overdue Debts Alert

A special alert banner appears when there are overdue debts:
- Shows count of overdue debts
- Displays warning message
- Uses red color scheme for visibility

### 3. Visual Design

- **Color Coding**:
  - Green theme for "You Should Receive" section
  - Red theme for "You Should Pay" section
  - Orange for outstanding amounts
  - Red alert for overdue debts

- **Layout**:
  - Two-column grid on large screens
  - Single column on mobile
  - Clear visual separation between sections
  - Icons for each metric type

## Component Structure

### DebtStatistics Component

**Location**: `src/components/dashboard/DebtStatistics.jsx`

**Props**:
- `debts`: Array of all debt objects
- `debtReturns`: Array of all debt return objects

**Calculations**:

```javascript
// For each direction (LENT/BORROWED):
1. Filter debts by direction
2. Calculate total original amount
3. Calculate total returned by summing all returns for those debts
4. Calculate outstanding = total - returned
5. Count active debts (where returned < original)

// For overdue count:
1. Check all debts
2. A debt is overdue if:
   - It has a due date
   - It's not fully paid (returned < original)
   - Due date is in the past
```

### Integration with Dashboard

**Location**: `src/pages/Dashboard.jsx`

**Changes**:
1. Imported `DebtStatistics` component
2. Removed old debt-related summary cards
3. Removed manual debt calculations
4. Added `<DebtStatistics>` component after summary cards
5. Cleaned up unused imports

## Data Flow

```
FinanceContext
    ↓
Dashboard (debts, debtReturns)
    ↓
DebtStatistics Component
    ↓
Calculations:
- Filter by direction (LENT/BORROWED)
- Sum original amounts
- Sum returns for each debt
- Calculate outstanding
- Count active debts
- Count overdue debts
    ↓
Render two cards + alert
```

## Calculation Logic

### Money Lent / Money Borrowed
```javascript
const totalOriginal = directionDebts.reduce(
  (sum, d) => sum + parseFloat(d[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0),
  0
);
```

### Money Returned / Money Paid Back
```javascript
const totalReturned = directionDebts.reduce((sum, debt) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const debtReturnsSum = debtReturns
    .filter((r) => r[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((rSum, r) => rSum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  return sum + debtReturnsSum;
}, 0);
```

### Outstanding Amount
```javascript
const outstanding = totalOriginal - totalReturned;
```

### Active Debts Count
```javascript
const activeCount = directionDebts.filter((debt) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const returned = debtReturns
    .filter((r) => r[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((sum, r) => sum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  const original = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);
  return returned < original;
}).length;
```

### Overdue Debts Count
```javascript
const overdueCount = debts.filter((debt) => {
  const dueDate = debt[COLUMNS.DEBTS.DUE_DATE];
  if (!dueDate) return false;

  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const returned = debtReturns
    .filter((r) => r[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((sum, r) => sum + parseFloat(r[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  const original = parseFloat(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] || 0);

  return returned < original && new Date(dueDate) < new Date();
}).length;
```

## Visual Layout

### Desktop View (Large Screens)
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                                               │
├─────────────────────────────────────────────────────────┤
│  [Month/Year Selector]                                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ This Month's │  │ This Year's  │                     │
│  │   Spending   │  │   Spending   │                     │
│  └──────────────┘  └──────────────┘                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐       │
│  │  You Should Receive │  │   You Should Pay    │       │
│  │                     │  │                     │       │
│  │ Money Lent          │  │ Money Borrowed      │       │
│  │ Money Returned      │  │ Money Paid Back     │       │
│  │ Outstanding         │  │ Outstanding         │       │
│  │ Active Debts        │  │ Active Debts        │       │
│  └─────────────────────┘  └─────────────────────┘       │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │ ⚠️ 2 Overdue Debts                           │       │
│  └──────────────────────────────────────────────┘       │
├─────────────────────────────────────────────────────────┤
│  [Charts]                                                │
├─────────────────────────────────────────────────────────┤
│  [Lists]                                                 │
└─────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌─────────────────────┐
│  Dashboard          │
├─────────────────────┤
│  [Selector]         │
├─────────────────────┤
│  ┌───────────────┐  │
│  │ This Month's  │  │
│  │   Spending    │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ This Year's   │  │
│  │   Spending    │  │
│  └───────────────┘  │
├─────────────────────┤
│  ┌───────────────┐  │
│  │ You Should    │  │
│  │   Receive     │  │
│  │               │  │
│  │ Money Lent    │  │
│  │ Returned      │  │
│  │ Outstanding   │  │
│  │ Active Debts  │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ You Should    │  │
│  │   Pay         │  │
│  │               │  │
│  │ Money Borrowed│  │
│  │ Paid Back     │  │
│  │ Outstanding   │  │
│  │ Active Debts  │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ ⚠️ Overdue    │  │
│  └───────────────┘  │
├─────────────────────┤
│  [Charts]           │
├─────────────────────┤
│  [Lists]            │
└─────────────────────┘
```

## Example Scenarios

### Scenario 1: Mixed Debts
```
Lent Debts:
- John: $1,000 (returned $300)
- Jane: $500 (returned $500) ✓ Paid
- Bob: $2,000 (returned $0, overdue)

Borrowed Debts:
- Alice: $800 (paid $400)
- Charlie: $1,200 (paid $1,200) ✓ Paid

Dashboard Shows:
┌─────────────────────┐  ┌─────────────────────┐
│ You Should Receive  │  │  You Should Pay     │
│                     │  │                     │
│ Money Lent: $3,500  │  │ Money Borrowed:     │
│                     │  │          $2,000     │
│ Money Returned:     │  │                     │
│          $800       │  │ Money Paid Back:    │
│                     │  │          $1,600     │
│ Outstanding:        │  │                     │
│        $2,700       │  │ Outstanding:        │
│                     │  │           $400      │
│ Active Debts: 2     │  │                     │
│                     │  │ Active Debts: 1     │
└─────────────────────┘  └─────────────────────┘

┌──────────────────────────────────────────────┐
│ ⚠️ 1 Overdue Debt                            │
│ You have debts that are past their due date  │
└──────────────────────────────────────────────┘
```

### Scenario 2: No Debts
```
Dashboard Shows:
┌─────────────────────┐  ┌─────────────────────┐
│ You Should Receive  │  │  You Should Pay     │
│                     │  │                     │
│ Money Lent: $0      │  │ Money Borrowed: $0  │
│ Money Returned: $0  │  │ Money Paid Back: $0 │
│ Outstanding: $0     │  │ Outstanding: $0     │
│ Active Debts: 0     │  │ Active Debts: 0     │
└─────────────────────┘  └─────────────────────┘

(No overdue alert shown)
```

## Benefits

1. **Clear Separation**: Lent and Borrowed debts are clearly separated
2. **Comprehensive View**: Shows original amounts, returns, and outstanding
3. **Active Tracking**: Shows count of active debts
4. **Overdue Alerts**: Visual warning for overdue debts
5. **Responsive Design**: Works on all screen sizes
6. **Color Coding**: Easy to distinguish between sections
7. **Real-time Updates**: Calculations update automatically

## Technical Details

### Files Modified
1. `src/components/dashboard/DebtStatistics.jsx` (NEW)
   - New component for debt statistics
   - Handles all calculations
   - Renders two cards + alert

2. `src/components/dashboard/index.js`
   - Exported DebtStatistics component

3. `src/pages/Dashboard.jsx`
   - Imported DebtStatistics
   - Removed old debt cards
   - Removed manual calculations
   - Added DebtStatistics component
   - Cleaned up imports

### Build Status
✅ Build successful - No errors or warnings

## Future Enhancements

Potential improvements:
1. **Charts**: Add pie charts showing debt distribution
2. **Trends**: Show debt trends over time
3. **Categories**: Break down debts by category
4. **Due Date Analysis**: Show upcoming due dates
5. **Payment History**: Show recent payments
6. **Export**: Export debt statistics to Excel
7. **Notifications**: Add notification badges for overdue debts
8. **Quick Actions**: Add buttons to record payments directly from dashboard

## Testing Checklist

- [x] Lent debts calculate correctly
- [x] Borrowed debts calculate correctly
- [x] Returns are summed correctly
- [x] Outstanding amounts are accurate
- [x] Active debt counts are correct
- [x] Overdue debts are detected correctly
- [x] Alert shows only when overdue debts exist
- [x] Responsive layout works on mobile
- [x] Color coding is consistent
- [x] Icons display correctly
- [x] Currency formatting is correct
- [x] Component updates when data changes
- [x] No console errors
- [x] Build succeeds

## Summary

The debt statistics feature provides a comprehensive, visually clear overview of all debt-related metrics on the Dashboard. Users can quickly see:
- How much they've lent and what's outstanding
- How much they've borrowed and what they still owe
- How many active debts they have in each category
- Whether any debts are overdue

The implementation is clean, maintainable, and follows React best practices with proper component structure and calculation logic.
