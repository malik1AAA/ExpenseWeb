# Table Sorting - Quick Reference

## What Was Added

Interactive sorting with visual icons to all data grids:
- ✅ ExpenseTable (5 sortable columns)
- ✅ DebtTable (8 sortable columns)
- ✅ CategoryBreakdown (3 sortable columns)
- ✅ AnnualCategoryBreakdown (3 sortable columns)
- ✅ AnnualMonthlyTable (4 sortable columns)

## How to Use

### For Users
1. **Click any column header** to sort by that column
2. **Click again** to toggle ascending ↔ descending
3. **Click different column** to sort by new column
4. **Look for icons:**
   - ↕️ ArrowUpDown = Not sorted
   - ↑ ArrowUp = Sorted ascending
   - ↓ ArrowDown = Sorted descending

### For Developers

#### Add Sorting to a Table

```javascript
import { useSortableTable } from '../../hooks/useSortableTable';
import { SortableHeader } from '../common';

function MyTable({ data }) {
  const { handleSort, getSortState, sortedData } = useSortableTable(
    data,
    'defaultField',  // Default sort field
    'desc'           // Default direction
  );

  return (
    <table>
      <thead>
        <tr>
          <SortableHeader
            label="Column Name"
            field="fieldName"
            sortState={getSortState('fieldName')}
            onSort={handleSort}
            align="left"  // or 'right', 'center'
          />
        </tr>
      </thead>
      <tbody>
        {sortedData.map(item => (
          <tr key={item.id}>
            <td>{item.fieldName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Sorting Behavior

| Action | Result |
|--------|--------|
| Click unsorted column | Sort descending |
| Click sorted column | Toggle asc ↔ desc |
| Click different column | Sort new column desc |
| Change filter | Keep sort, reset to page 1 |
| Change page | Keep sort |

## Data Type Handling

| Type | Detection | Sort Method |
|------|-----------|-------------|
| Date | Field name contains "date" or ISO format | Chronological |
| Number | Field name contains "amount", "total", etc. | Numeric |
| String | Everything else | Alphabetical (case-insensitive) |

## Accessibility

### Keyboard
- **Tab** - Navigate to headers
- **Enter/Space** - Activate sort

### Screen Readers
- `aria-sort="ascending"` - Announced as "sorted ascending"
- `aria-sort="descending"` - Announced as "sorted descending"
- `aria-sort="none"` - Announced as "not sorted"

## Files Reference

### New Files
- `src/hooks/useSortableTable.js` - Sorting logic hook
- `src/components/common/SortableHeader.jsx` - Header component

### Modified Files
- `src/components/common/index.js` - Export SortableHeader
- `src/components/expenses/ExpenseTable.jsx`
- `src/components/debts/DebtTable.jsx`
- `src/components/reports/CategoryBreakdown.jsx`
- `src/components/reports/AnnualCategoryBreakdown.jsx`
- `src/components/reports/AnnualMonthlyTable.jsx`

## Common Patterns

### Calculated Fields
```javascript
// Enrich data before sorting
const enrichedData = data.map(item => ({
  ...item,
  _calculatedField: calculateValue(item)
}));

const { sortedData } = useSortableTable(enrichedData, '_calculatedField', 'desc');
```

### With Pagination
```javascript
const { handleSort, sortedData } = useSortableTable(data, 'date', 'desc');

// Sort first, then paginate
const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
```

### With Filters
```javascript
const filteredData = data.filter(item => matchesFilter(item));
const { sortedData } = useSortableTable(filteredData, 'date', 'desc');
```

## Troubleshooting

### Issue: Sorting not working
**Solution:** Check that field names match data properties exactly

### Issue: Wrong sort order
**Solution:** Verify data type detection (check field names)

### Issue: Icons not showing
**Solution:** Ensure SortableHeader is imported and used correctly

### Issue: Row click conflicts
**Solution:** Use `e.stopPropagation()` on action buttons

## Build Status

✅ **Build Successful**
- No errors
- No warnings
- All tables working
- Accessibility verified

---

**Status:** ✅ Complete  
**Version:** 1.0.0  
**Last Updated:** 2026-01-29
