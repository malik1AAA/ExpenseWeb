# Debt Management Module

## Overview
The Debt Management module allows users to track money lent to others and money borrowed from others. It provides a comprehensive view of all debts with calculated fields for remaining amounts and status tracking.

## Features Implemented

### 1. Debt Directions
- **Lent**: Money given to another person (they owe you)
- **Borrowed**: Money taken from another person (you owe them)

### 2. Tab-Based Navigation
Three tabs for different views:
- **All Debts**: Shows all debts regardless of direction
- **Money Lent**: Shows only debts where you lent money
- **Money Borrowed**: Shows only debts where you borrowed money

### 3. Debt Table Columns
- **Person**: Name of the person involved
- **Original Amount**: Initial debt amount
- **Date**: Date when debt was created
- **Due Date**: Expected repayment date
- **DebtCategory**: Category (Cash or Food)
- **Returned/Paid**: Total amount returned/paid so far
- **Remaining**: Calculated remaining balance
- **Status**: Current status (Active, Partial, Overdue, Paid)
- **Actions**: Edit and Delete buttons

### 4. Calculated Fields
All calculations are done dynamically from the data:

**Total Returned**: 
```javascript
SUM(DebtReturns.Amount WHERE DebtReturns.DebtID = Debt.DebtID)
```

**Remaining Amount**:
```javascript
OriginalAmount - TotalReturned
```

**Status Logic**:
- **Paid**: `remainingAmount <= 0`
- **Partial**: `totalReturned > 0 AND remainingAmount > 0`
- **Overdue**: `totalReturned === 0 AND dueDate < today`
- **Active**: All other cases

### 5. Summary Cards
Four summary cards showing:
- **Total Lent**: Sum of all lent debts (original amounts)
- **Total Borrowed**: Sum of all borrowed debts (original amounts)
- **Net Position**: Lent remaining - Borrowed remaining
- **Overdue**: Count of overdue debts

### 6. Payment Recording
- Record payments against debts
- Track payment history
- View all payments for a specific debt
- Delete payments if needed
- Prevent overpayment (cannot exceed remaining balance)

## Components Created

### 1. DebtTable
Displays debts in a table format with:
- Calculated remaining amounts
- Status badges with color coding
- Direction badges (Lent/Borrowed)
- Edit and Delete actions
- Sorted by due date (earliest first)

### 2. DebtForm
Modal form for adding/editing debts with:
- Person name (required)
- Direction (Lent/Borrowed)
- Debt Category (Cash/Food)
- Original Amount (required, must be > 0)
- Date (required)
- Due Date (required)
- Notes (optional)

### 3. DebtReturnForm
Modal form for recording payments with:
- Debt information display
- Payment Amount (required, cannot exceed remaining)
- Payment Date (required)
- Notes (optional)

### 4. DebtReturnsList
Displays payment history for a specific debt:
- Shows all payments sorted by date (newest first)
- Displays amount, date, and notes
- Delete button for each payment

### 5. DebtSummary
Summary cards showing:
- Total Lent (with remaining)
- Total Borrowed (with remaining)
- Net Position (who owes whom)
- Overdue count

## Architecture

### Data Flow
```
FinanceContext (debts, debtReturns)
    ↓
Debts Page
    ↓
    ├─→ DebtSummary (calculated totals)
    ├─→ DebtTable (with calculated fields)
    ├─→ DebtForm (add/edit)
    ├─→ DebtReturnForm (record payments)
    └─→ DebtReturnsList (view history)
```

### Key Design Decisions

1. **No Stored Calculations**: Remaining amount is always calculated from OriginalAmount - SUM(Returns), never stored
2. **Status Calculation**: Status is determined dynamically based on remaining amount and due date
3. **Schema Compliance**: All field names use the schema constants from `excelSchema.js`
4. **Tab Filtering**: Tabs filter the same data source, no separate state needed
5. **Payment Validation**: Cannot record payment exceeding remaining balance

## Status Color Coding

- **Active**: Gray badge (`bg-surface-100 text-surface-700`)
- **Partial**: Blue badge (`bg-blue-100 text-blue-700`)
- **Overdue**: Red badge (`bg-red-100 text-red-700`)
- **Paid**: Green badge (`bg-green-100 text-green-700`)

## Usage Example

```jsx
import Debts from './pages/Debts';

// In your router
<Route path="/debts" element={<Debts />} />
```

## File Structure
```
src/
├── components/
│   └── debts/
│       ├── DebtSummary.jsx
│       ├── DebtTable.jsx
│       ├── DebtForm.jsx
│       ├── DebtReturnForm.jsx
│       ├── DebtReturnsList.jsx
│       └── index.js
└── pages/
    └── Debts.jsx
```

## Context Integration

The module uses these FinanceContext functions:
- `addDebt(debt)` - Add new debt
- `updateDebt(id, debt)` - Update existing debt
- `deleteDebt(id)` - Delete debt
- `addDebtReturn(returnData)` - Record payment
- `deleteDebtReturn(id)` - Delete payment

## Future Enhancements

Potential additions:
- Recurring debts (monthly payments)
- Interest calculation
- Payment reminders/notifications
- Export debts to Excel
- Debt aging analysis
- Payment scheduling
- Bulk payment recording
- Debt consolidation tracking
