# Currency Formatting Implementation

## Overview

The application uses a centralized currency formatting utility that defaults to Pakistani Rupees (PKR) with the format "Rs. 1,250". The implementation is designed to be easily configurable through Settings in the future.

## Current Implementation

### Default Currency
- **Currency Code**: PKR (Pakistani Rupee)
- **Symbol**: Rs.
- **Format**: `Rs. 1,250` (no decimals, thousand separators)
- **Symbol Position**: Before the amount

### Format Examples
```javascript
formatCurrency(1250)        // "Rs. 1,250"
formatCurrency(25000)       // "Rs. 25,000"
formatCurrency(1250000)     // "Rs. 1,250,000"
formatCurrency(0)           // "Rs. 0"
formatCurrency(null)        // "Rs. 0"
formatCurrency(undefined)   // "Rs. 0"
```

## File Structure

### Location
```
src/utils/currencyUtils.js
```

### Exports

#### Constants
- `DEFAULT_CURRENCY` - Current default currency code ('PKR')
- `CURRENCY_CONFIG` - Configuration object for all supported currencies

#### Functions
- `formatCurrency(amount, currency)` - Main formatting function
- `formatCurrencyWithSign(amount, currency)` - Format with +/- sign
- `parseCurrency(value)` - Parse currency string to number
- `getCurrencySymbol(currency)` - Get currency symbol
- `getAvailableCurrencies()` - Get list of supported currencies
- `getCurrencyConfig(currency)` - Get currency configuration
- `calculatePercentageChange(current, previous)` - Calculate percentage change
- `formatPercentage(value, decimals)` - Format percentage

## Currency Configuration

### Current Configuration
```javascript
export const CURRENCY_CONFIG = {
  PKR: {
    symbol: 'Rs.',
    locale: 'en-PK',
    decimals: 0,
    symbolPosition: 'before',
  },
  USD: {
    symbol: '$',
    locale: 'en-US',
    decimals: 2,
    symbolPosition: 'before',
  },
  EUR: {
    symbol: '€',
    locale: 'de-DE',
    decimals: 2,
    symbolPosition: 'before',
  },
  GBP: {
    symbol: '£',
    locale: 'en-GB',
    decimals: 2,
    symbolPosition: 'before',
  },
  INR: {
    symbol: '₹',
    locale: 'en-IN',
    decimals: 2,
    symbolPosition: 'before',
  },
};
```

### Configuration Properties
- `symbol` - Currency symbol (e.g., 'Rs.', '$', '€')
- `locale` - Locale for number formatting (affects thousand separators)
- `decimals` - Number of decimal places (0 for PKR, 2 for most others)
- `symbolPosition` - Where to place symbol ('before' or 'after')

## Usage in Components

### Basic Usage
```javascript
import { formatCurrency } from '../utils/currencyUtils';

// In component
const amount = 1250;
const formatted = formatCurrency(amount); // "Rs. 1,250"
```

### With Specific Currency
```javascript
import { formatCurrency } from '../utils/currencyUtils';

const amount = 1250;
const usd = formatCurrency(amount, 'USD'); // "$1,250.00"
const eur = formatCurrency(amount, 'EUR'); // "€1,250.00"
```

### With Sign
```javascript
import { formatCurrencyWithSign } from '../utils/currencyUtils';

const positive = formatCurrencyWithSign(1250);  // "+Rs. 1,250"
const negative = formatCurrencyWithSign(-1250); // "-Rs. 1,250"
```

### Parse Currency String
```javascript
import { parseCurrency } from '../utils/currencyUtils';

const value = parseCurrency("Rs. 1,250"); // 1250
const value2 = parseCurrency("$1,250.00"); // 1250
```

## Components Using Currency Formatting

All components that display monetary values use the `formatCurrency` function:

### Dashboard Components
- `SummaryCard` - Displays financial metrics
- `DebtStatistics` - Shows debt amounts
- `RecentExpensesList` - Shows expense amounts
- `OutstandingDebtsList` - Shows debt amounts

### Expense Components
- `ExpenseTable` - Shows expense amounts
- `ExpenseSummary` - Shows totals and averages

### Debt Components
- `DebtTable` - Shows debt amounts
- `DebtSummary` - Shows debt totals
- `DebtDetails` - Shows debt information
- `DebtReturnForm` - Shows remaining amounts

### Report Components
- `ReportSummary` - Shows report totals
- `CategoryBreakdown` - Shows category amounts
- `AnnualReportSummary` - Shows annual totals
- `AnnualMonthlyTable` - Shows monthly totals

## Future Settings Integration

### Planned Implementation

To allow users to change currency through Settings, the following changes will be needed:

#### 1. Add Currency State to FinanceContext
```javascript
// In FinanceContext.jsx
const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

// Add to context value
const value = {
  // ... existing state
  currency,
  setCurrency,
};
```

#### 2. Create useCurrency Hook
```javascript
// In hooks/useCurrency.js
import { useContext } from 'react';
import { FinanceContext } from '../context/FinanceContext';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyUtils';

export const useCurrency = () => {
  const { currency } = useContext(FinanceContext);
  
  const formatCurrency = (amount) => {
    return formatCurrencyUtil(amount, currency);
  };
  
  return {
    currency,
    formatCurrency,
  };
};
```

#### 3. Add Currency Selector to Settings
```javascript
// In Settings page
import { useFinance } from '../hooks/useFinance';
import { getAvailableCurrencies } from '../utils/currencyUtils';

function CurrencySettings() {
  const { currency, setCurrency } = useFinance();
  const currencies = getAvailableCurrencies();
  
  return (
    <div>
      <label>Currency</label>
      <select 
        value={currency} 
        onChange={(e) => setCurrency(e.target.value)}
      >
        {currencies.map(code => (
          <option key={code} value={code}>{code}</option>
        ))}
      </select>
    </div>
  );
}
```

#### 4. Update Components to Use Hook
```javascript
// Instead of:
import { formatCurrency } from '../utils/currencyUtils';
const formatted = formatCurrency(amount);

// Use:
import { useCurrency } from '../hooks/useCurrency';
const { formatCurrency } = useCurrency();
const formatted = formatCurrency(amount);
```

#### 5. Persist Currency Setting
```javascript
// Save to localStorage
useEffect(() => {
  localStorage.setItem('currency', currency);
}, [currency]);

// Load from localStorage on init
const [currency, setCurrency] = useState(
  localStorage.getItem('currency') || DEFAULT_CURRENCY
);
```

## Adding New Currencies

To add a new currency, simply add it to the `CURRENCY_CONFIG` object:

```javascript
export const CURRENCY_CONFIG = {
  // ... existing currencies
  AED: {
    symbol: 'د.إ',
    locale: 'ar-AE',
    decimals: 2,
    symbolPosition: 'before',
  },
  SAR: {
    symbol: '﷼',
    locale: 'ar-SA',
    decimals: 2,
    symbolPosition: 'before',
  },
};
```

## Testing

### Test Cases
```javascript
// Basic formatting
formatCurrency(0)           // "Rs. 0"
formatCurrency(1)           // "Rs. 1"
formatCurrency(1000)        // "Rs. 1,000"
formatCurrency(1234567)     // "Rs. 1,234,567"

// Decimal handling
formatCurrency(1250.50)     // "Rs. 1,251" (rounded)
formatCurrency(1250.99)     // "Rs. 1,251" (rounded)

// Negative values
formatCurrency(-1250)       // "Rs. -1,250"

// Invalid values
formatCurrency(null)        // "Rs. 0"
formatCurrency(undefined)   // "Rs. 0"
formatCurrency(NaN)         // "Rs. 0"
formatCurrency("abc")       // "Rs. 0"

// Different currencies
formatCurrency(1250, 'USD') // "$1,250.00"
formatCurrency(1250, 'EUR') // "€1,250.00"
formatCurrency(1250, 'GBP') // "£1,250.00"
```

## Best Practices

### DO
- ✅ Always use `formatCurrency` for displaying monetary values
- ✅ Use the default currency parameter when possible
- ✅ Handle null/undefined values (function handles them)
- ✅ Use `parseCurrency` when converting user input to numbers
- ✅ Keep currency formatting centralized in utils

### DON'T
- ❌ Don't hardcode currency symbols in components
- ❌ Don't format currency manually with string concatenation
- ❌ Don't create custom formatting functions in components
- ❌ Don't assume a specific currency format
- ❌ Don't store formatted strings in the database

## Migration Guide

If you find components with hardcoded currency formatting:

### Before
```javascript
// ❌ Bad
const formatted = `$${amount.toFixed(2)}`;
const formatted = `Rs. ${amount}`;
```

### After
```javascript
// ✅ Good
import { formatCurrency } from '../utils/currencyUtils';
const formatted = formatCurrency(amount);
```

## Performance Considerations

- The `formatCurrency` function is lightweight and fast
- No external dependencies beyond built-in `Intl.NumberFormat`
- Safe to call frequently (e.g., in list rendering)
- Consider memoization if formatting the same value multiple times

## Accessibility

- Currency symbols are properly placed for screen readers
- Numbers are formatted with proper thousand separators
- Consider adding `aria-label` for complex currency displays:
```javascript
<span aria-label={`${amount} Pakistani Rupees`}>
  {formatCurrency(amount)}
</span>
```

## Summary

The currency formatting implementation:
- ✅ Defaults to PKR with "Rs. 1,250" format
- ✅ Centralized in `utils/currencyUtils.js`
- ✅ Used consistently across all components
- ✅ Ready for Settings integration
- ✅ Supports multiple currencies
- ✅ Handles edge cases (null, undefined, NaN)
- ✅ No hardcoded formatting in components
- ✅ Easy to extend with new currencies
