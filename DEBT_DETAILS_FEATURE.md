# Debt Details and Transaction History Feature

## Overview

The debt details feature provides a comprehensive view of individual debt records, including all associated transactions and the current balance. Users can click on any debt row in the table to view a detailed modal with complete information and a visual transaction timeline.

## Features

### 1. Debt Information Display

The details modal shows all key information about the debt:

- **Person**: Name of the person involved in the debt
- **Direction**: Whether the money was Lent or Borrowed (with color coding)
- **Original Amount**: The initial debt amount
- **Date**: When the debt was created
- **Due Date**: When the debt is due (if set)
- **Status**: Current status (Active, Partial, Paid, Overdue)
- **Total Returned**: Sum of all payments/returns made
- **Remaining**: Current outstanding balance
- **Notes**: Any additional notes about the debt

### 2. Transaction History Timeline

A visual timeline showing all transactions related to the debt:

1. **Original Debt Entry**
   - Shows the initial debt creation
   - Color-coded based on direction (green for Lent, red for Borrowed)
   - Displays the original amount

2. **Return/Payment Entries**
   - Shows each payment made against the debt
   - Displayed in blue color
   - Shows amount and date
   - Includes any notes attached to the payment

3. **Current Balance**
   - Shows the remaining balance at the end
   - Green "Fully Paid" indicator if balance is 0
   - Red "Remaining" indicator if balance > 0

### 3. Visual Design

- **Timeline Layout**: Vertical timeline with connected dots
- **Color Coding**:
  - Green: Lent debts and paid status
  - Red: Borrowed debts and remaining balance
  - Blue: Return/payment transactions
- **Icons**: Lucide React icons for visual clarity
- **Responsive**: Works on all screen sizes

## Usage

### Viewing Debt Details

1. Navigate to the Debts page
2. Click on any debt row in the table
3. The details modal will open showing:
   - All debt information in a grid layout
   - Transaction history timeline below

### Understanding the Timeline

The timeline shows transactions in chronological order:

```
01 Oct 2026   Lent       Rs.50,000
   ↓
08 Oct 2026   Returned   Rs.10,000
   ↓
12 Oct 2026   Returned   Rs.10,000
   ↓
Remaining: Rs.30,000
```

Each entry shows:
- Date of transaction
- Type (Lent/Borrowed/Returned)
- Amount
- Notes (if any)

## Component Structure

### DebtDetails Component

**Location**: `src/components/debts/DebtDetails.jsx`

**Props**:
- `isOpen`: Boolean to control modal visibility
- `onClose`: Callback function to close the modal
- `debt`: The debt object to display
- `debtReturns`: Array of all debt returns for calculating totals

**Features**:
- Calculates total returned amount from debtReturns
- Calculates remaining balance (Original - Total Returned)
- Determines current status based on remaining amount
- Builds transaction history array sorted by date
- Renders visual timeline with icons and color coding

### Integration with DebtTable

The DebtTable component now accepts an `onViewDetails` callback:

```javascript
<DebtTable
  debts={debts}
  debtReturns={debtReturns}
  direction={activeTab}
  onEdit={handleEditDebt}
  onDelete={handleDeleteRequest}
  onRecordReturn={handleRecordPayment}
  onViewDetails={handleViewDetails}  // New prop
/>
```

When a row is clicked, it triggers the `onViewDetails` callback with the debt object.

## Calculations

### Total Returned Amount

```javascript
const totalReturned = returns.reduce(
  (sum, ret) => sum + parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0), 
  0
);
```

### Remaining Balance

```javascript
const remaining = originalAmount - totalReturned;
```

### Status Determination

```javascript
const getStatus = () => {
  if (remaining <= 0) return { label: 'Paid', color: 'green' };
  if (totalReturned > 0 && remaining > 0) return { label: 'Partial', color: 'blue' };
  
  const dueDate = debt[COLUMNS.DEBTS.DUE_DATE] ? new Date(debt[COLUMNS.DEBTS.DUE_DATE]) : null;
  const now = new Date();
  if (totalReturned === 0 && dueDate && dueDate < now) return { label: 'Overdue', color: 'red' };
  
  return { label: 'Active', color: 'gray' };
};
```

## Transaction History Building

The transaction history is built by combining:

1. **Original Debt Entry**
   ```javascript
   {
     date: debt[COLUMNS.DEBTS.DATE],
     type: isLent ? 'Lent' : 'Borrowed',
     amount: originalAmount,
     notes: debt[COLUMNS.DEBTS.NOTES] || '',
     isOriginal: true,
   }
   ```

2. **Return Entries**
   ```javascript
   returns.map(ret => ({
     date: ret[COLUMNS.DEBT_RETURNS.DATE],
     type: 'Returned',
     amount: parseFloat(ret[COLUMNS.DEBT_RETURNS.AMOUNT] || 0),
     notes: ret[COLUMNS.DEBT_RETURNS.NOTES] || '',
     isOriginal: false,
   }))
   ```

3. **Sorted by Date**
   ```javascript
   .sort((a, b) => new Date(a.date) - new Date(b.date))
   ```

## Visual Elements

### Icons Used

- `User`: Person name
- `Calendar`: Date fields
- `DollarSign`: Amount fields
- `Clock`: Due date
- `FileText`: Notes
- `TrendingUp`: Lent direction
- `TrendingDown`: Borrowed direction

### Color Scheme

**Direction Colors**:
- Lent: Green (`text-green-600`, `bg-green-100`)
- Borrowed: Red (`text-red-600`, `bg-red-100`)

**Status Colors**:
- Paid: Green border and background
- Partial: Blue border and background
- Overdue: Red border and background
- Active: Gray border and background

**Transaction Colors**:
- Original (Lent): Green circle with border
- Original (Borrowed): Red circle with border
- Returned: Blue circle with border
- Remaining: Red highlighted box
- Fully Paid: Green highlighted box

## Example Scenarios

### Scenario 1: Active Debt (No Returns)

```
Person: John Doe
Direction: Lent
Original Amount: Rs.50,000
Date: 01 Oct 2026
Due Date: 01 Nov 2026
Status: Active
Total Returned: Rs.0
Remaining: Rs.50,000

Timeline:
[Green Circle] 01 Oct 2026 - Lent - Rs.50,000
[Red Box] Remaining: Rs.50,000
```

### Scenario 2: Partial Payment

```
Person: Jane Smith
Direction: Borrowed
Original Amount: Rs.30,000
Date: 15 Sep 2026
Due Date: 15 Oct 2026
Status: Partial
Total Returned: Rs.10,000
Remaining: Rs.20,000

Timeline:
[Red Circle] 15 Sep 2026 - Borrowed - Rs.30,000
[Blue Circle] 20 Sep 2026 - Returned - Rs.10,000
[Red Box] Remaining: Rs.20,000
```

### Scenario 3: Fully Paid

```
Person: Bob Johnson
Direction: Lent
Original Amount: Rs.25,000
Date: 01 Aug 2026
Due Date: 01 Sep 2026
Status: Paid
Total Returned: Rs.25,000
Remaining: Rs.0

Timeline:
[Green Circle] 01 Aug 2026 - Lent - Rs.25,000
[Blue Circle] 15 Aug 2026 - Returned - Rs.15,000
[Blue Circle] 25 Aug 2026 - Returned - Rs.10,000
[Green Box] ✓ Fully Paid
```

## Benefits

1. **Complete Overview**: See all debt information in one place
2. **Visual Timeline**: Easy to understand transaction history
3. **Color Coding**: Quick visual identification of debt status
4. **Detailed Tracking**: See each payment with dates and notes
5. **Balance Clarity**: Clear indication of remaining amount
6. **Audit Trail**: Complete history of all transactions

## Future Enhancements

Potential improvements:

1. **Edit from Details**: Allow editing debt directly from details modal
2. **Add Return from Details**: Quick add return button in timeline
3. **Export History**: Export transaction history to PDF/Excel
4. **Print View**: Optimized layout for printing
5. **Attachments**: Add file attachments to debt or returns
6. **Comments**: Add comments/notes to timeline entries
7. **Notifications**: Show upcoming due dates in timeline
8. **Charts**: Add spending/return charts in details view
