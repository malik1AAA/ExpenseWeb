# Debt Return Functionality

## Overview

The debt return functionality allows users to record payments/returns against existing debts. Each debt can have multiple return records, and the remaining amount is calculated dynamically based on the original amount minus the sum of all returns.

## Features

### 1. Record Return Button
- Each debt row in the table has a "Record Return" button (green dollar sign icon)
- The button only appears if the debt has a remaining balance > 0
- Clicking the button opens a modal form to record the return

### 2. Return Form Fields
The return form includes:
- **Date** (required): Date of the return/payment
- **Amount** (required): Amount being returned (must be > 0 and ≤ remaining balance)
- **Notes** (optional): Additional information about the return

### 3. Validation Rules
- Amount must be greater than 0
- Amount cannot exceed the remaining balance
- Date is required
- The form displays the current remaining balance for reference

### 4. Dynamic Remaining Calculation
The remaining amount is calculated dynamically using the formula:
```
remainingAmount = OriginalAmount - SUM(all returns for that DebtID)
```

This calculation happens in real-time and is never stored in the database. The OriginalAmount field is never modified.

### 5. Separate Return Records
Each return is stored as a separate record in the `debtReturns` array with:
- ReturnID (auto-generated)
- DebtID (links to the parent debt)
- Date
- Amount
- Notes

## Implementation Details

### Components

#### 1. DebtTable Component
**File:** `src/components/debts/DebtTable.jsx`

Added:
- `onRecordReturn` prop to handle the record return button click
- Green dollar sign icon button in the actions column
- Button only renders if `remaining > 0` and `onRecordReturn` is provided

```javascript
{remaining > 0 && onRecordReturn && (
  <button
    onClick={() => onRecordReturn(debt)}
    className="p-1.5 rounded-lg hover:bg-green-50 transition-colors"
    title="Record Return"
  >
    <DollarSign className="w-4 h-4 text-green-600" />
  </button>
)}
```

#### 2. DebtReturnForm Component
**File:** `src/components/debts/DebtReturnForm.jsx`

Features:
- Displays debt information (person, remaining amount, due date, original amount)
- Form fields: Amount, Date, Notes
- Validates amount > 0 and ≤ remaining balance
- Automatically associates the DebtID with the return record
- Shows real-time validation errors

#### 3. Debts Page
**File:** `src/pages/Debts.jsx`

State management:
- `isReturnFormOpen`: Controls return form modal visibility
- `debtForReturn`: Stores the debt being processed for return

Functions:
- `handleRecordPayment(debt)`: Opens the return form for a specific debt
- `handleReturnFormSubmit(returnData)`: Submits the return data to FinanceContext
- `calculateRemaining(debt)`: Calculates remaining balance for a debt

### FinanceContext Integration

The `addDebtReturn` function in FinanceContext:
```javascript
const addDebtReturn = useCallback(
  (returnEntry) => {
    if (!returnEntry) return null;
    const newReturn = {
      ...returnEntry,
      [RETURN_ID]: returnEntry[RETURN_ID] || generateId('RET'),
    };
    setDebtReturns((prev) => [newReturn, ...prev]);
    return newReturn;
  },
  [generateId]
);
```

This function:
1. Accepts a return entry object
2. Auto-generates a ReturnID if not provided
3. Adds the return to the debtReturns array
4. Returns the new return object

### Dynamic Calculation

The remaining amount is calculated in multiple places:

#### In DebtTable Component:
```javascript
const calculateRemaining = (debt) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const totalReturned = debtReturns
    .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  
  return {
    totalReturned,
    remaining: debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned,
  };
};
```

#### In Debts Page:
```javascript
const calculateRemaining = (debt) => {
  const debtId = debt[COLUMNS.DEBTS.DEBT_ID];
  const totalReturned = debtReturns
    .filter(ret => ret[COLUMNS.DEBT_RETURNS.DEBT_ID] === debtId)
    .reduce((sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 0);
  
  return debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT] - totalReturned;
};
```

## User Flow

### Recording a Return

1. User navigates to the Debts page
2. User sees a list of debts with their remaining balances
3. User clicks the green dollar sign icon on a debt with remaining balance > 0
4. A modal opens showing:
   - Debt information (person, remaining, due date, original amount)
   - Form fields for Date, Amount, and Notes
5. User fills in the form:
   - Selects or enters the date
   - Enters the amount (validated against remaining balance)
   - Optionally adds notes
6. User clicks "Record Payment"
7. The form validates the input
8. If valid, the return is added to the debtReturns array
9. The modal closes
10. The UI updates immediately:
    - The debt's "Returned/Paid" column increases
    - The debt's "Remaining" column decreases
    - The debt's status may change (e.g., from "Active" to "Partial" or "Paid")

### Viewing Return History

1. User can view all returns for a debt in the Payment History modal
2. Each return shows:
   - Amount
   - Date
   - Notes
3. User can delete individual returns if needed

## Data Structure

### Debt Return Record
```javascript
{
  ReturnID: "RET123456",           // Auto-generated unique ID
  DebtID: "DEBT789012",            // Links to parent debt
  Date: "2024-01-15",              // Return date (ISO format)
  Amount: 500.00,                  // Return amount (number)
  Notes: "Partial payment"         // Optional notes
}
```

### Calculation Example

**Original Debt:**
```javascript
{
  DebtID: "DEBT789012",
  Person: "John Doe",
  OriginalAmount: 1000.00,
  Date: "2024-01-01",
  DueDate: "2024-02-01"
}
```

**Returns:**
```javascript
[
  { ReturnID: "RET001", DebtID: "DEBT789012", Date: "2024-01-10", Amount: 300.00 },
  { ReturnID: "RET002", DebtID: "DEBT789012", Date: "2024-01-15", Amount: 200.00 }
]
```

**Calculation:**
```
Total Returned = 300 + 200 = 500
Remaining = 1000 - 500 = 500
```

**Status:** Partial (because totalReturned > 0 and remaining > 0)

## Status Updates

The debt status automatically updates based on the remaining amount:

- **Paid**: remaining ≤ 0
- **Partial**: totalReturned > 0 AND remaining > 0
- **Overdue**: totalReturned === 0 AND dueDate < today
- **Active**: All other cases

## Benefits of Dynamic Calculation

1. **Data Integrity**: OriginalAmount is never modified, preserving the audit trail
2. **Flexibility**: Returns can be added, edited, or deleted without affecting the original debt
3. **Accuracy**: Remaining balance is always calculated from the source of truth
4. **Simplicity**: No need to update multiple records when a return is added
5. **Transparency**: Full history of all returns is maintained

## Edge Cases Handled

1. **Zero Remaining Balance**: The "Record Return" button is hidden when remaining = 0
2. **Overpayment Prevention**: Form validation prevents entering amount > remaining
3. **Empty Returns**: If no returns exist, remaining = original amount
4. **Deleted Returns**: If a return is deleted, remaining is recalculated automatically
5. **Multiple Returns**: Supports unlimited returns per debt

## Future Enhancements

Potential improvements:
1. **Bulk Returns**: Record multiple returns at once
2. **Recurring Returns**: Set up automatic recurring returns
3. **Return Categories**: Categorize returns (e.g., cash, check, bank transfer)
4. **Return Attachments**: Attach receipts or proof of payment
5. **Return Notifications**: Send notifications when returns are recorded
6. **Return Scheduling**: Schedule future returns
7. **Partial Payment Plans**: Create payment plans for large debts
8. **Return History Export**: Export return history to Excel/PDF

## Testing Checklist

- [ ] Can open return form by clicking dollar sign icon
- [ ] Return form shows correct debt information
- [ ] Amount validation prevents zero or negative amounts
- [ ] Amount validation prevents overpayment
- [ ] Date is required
- [ ] Notes field is optional
- [ ] Return is added to debtReturns array
- [ ] Remaining amount updates immediately
- [ ] Status updates correctly (Active → Partial → Paid)
- [ ] Can view return history
- [ ] Can delete individual returns
- [ ] Remaining recalculates after return deletion
- [ ] Button hides when remaining = 0
- [ ] Multiple returns can be recorded for same debt
- [ ] ReturnID is auto-generated
- [ ] DebtID is correctly associated with return
