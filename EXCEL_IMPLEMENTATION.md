# Excel Import/Export Implementation

## Overview
Implemented complete Excel import/export functionality in the Settings page using the existing `excelService.js`.

## Files Created/Modified

### New Files
1. **`src/hooks/useExcelImport.js`** - Custom hook for Excel operations
   - Handles file selection, import, and export
   - Detects and handles duplicate IDs
   - Manages loading states and error/warning messages
   - Provides confirmation dialog for data replacement

2. **`src/components/settings/ExcelManager.jsx`** - UI component for Excel management
   - File picker with validation
   - Import/Export buttons with loading states
   - Success summary showing record counts
   - Error and warning displays
   - Confirmation dialog before replacing data

3. **`src/components/settings/index.js`** - Export barrel file

### Modified Files
1. **`src/context/FinanceContext.jsx`**
   - Added bulk import methods: `importExpenses`, `importDebts`, `importDebtReturns`, `importCategories`
   - Added clear methods: `clearExpenses`, `clearDebts`, `clearDebtReturns`, `clearCategories`
   - All methods support `{ replace: true }` option to replace existing data

2. **`src/pages/Settings.jsx`**
   - Replaced placeholder "Data Source" section with `<ExcelManager />` component

## Features Implemented

### Import Functionality
- ✅ File picker accepting `.xlsx`, `.xls`, `.xlsm` files
- ✅ Validation of file type and structure
- ✅ Detection of missing required sheets (Expenses, Categories)
- ✅ Validation of required columns per sheet
- ✅ Duplicate ID detection and handling
- ✅ Empty workbook detection
- ✅ User-friendly error messages
- ✅ Warning messages for non-critical issues
- ✅ Confirmation dialog before replacing data
- ✅ Success summary showing:
  - File name
  - Number of expense records
  - Number of debt records
  - Number of debt return records
  - Number of categories
  - Number of skipped duplicates

### Export Functionality
- ✅ Export all data to Excel file
- ✅ Creates workbook with 4 sheets: Expenses, Debts, DebtReturns, Categories
- ✅ Proper column ordering based on schema
- ✅ Auto-sized columns
- ✅ Loading state during export
- ✅ Warning if no data to export

### Error Handling
- ✅ Invalid file types
- ✅ Missing required sheets
- ✅ Missing required columns
- ✅ Empty workbooks
- ✅ Duplicate IDs (skipped with warning)
- ✅ File read errors
- ✅ Parse errors

## User Flow

### Import
1. User clicks "Choose Excel File"
2. File picker opens (filtered to Excel files)
3. User selects a file
4. File info appears (name, size)
5. User clicks "Import Excel"
6. Confirmation dialog appears warning about data replacement
7. User confirms
8. File is parsed and validated
9. Success summary or error messages are displayed

### Export
1. User clicks "Download Excel"
2. All current data is exported to `finance-data.xlsx`
3. File downloads automatically

## Technical Details

### Data Flow
```
User Action → ExcelManager Component → useExcelImport Hook → excelService → FinanceContext
```

### Duplicate Handling
- Duplicates are detected within each sheet
- First occurrence is kept, subsequent duplicates are skipped
- Count of skipped duplicates is shown in success summary
- Warning message is displayed

### Validation Order
1. File type validation
2. File read attempt
3. Sheet detection (required vs optional)
4. Column validation per sheet
5. Data type conversion (dates, numbers)
6. Enum validation (Direction, DebtCategory, Type)
7. Duplicate detection
8. Empty data check

### State Management
- `selectedFile` - Currently selected file
- `isImporting` - Import loading state
- `isExporting` - Export loading state
- `importResult` - Success summary object
- `errors` - Array of error messages
- `warnings` - Array of warning messages

## Testing Recommendations

1. **Import Tests**
   - Valid file with all sheets
   - File with missing optional sheets
   - File with missing required sheets
   - File with invalid columns
   - File with duplicate IDs
   - Empty file
   - Invalid file type
   - Corrupted file

2. **Export Tests**
   - Export with data
   - Export with no data
   - Verify all 4 sheets are created
   - Verify column order
   - Verify data integrity

3. **UI Tests**
   - File selection
   - Import button disabled until file selected
   - Loading states
   - Error message display
   - Warning message display
   - Success summary display
   - Confirmation dialog
   - Clear file selection

## Future Enhancements

- [ ] Merge import (append instead of replace)
- [ ] Preview data before import
- [ ] Column mapping UI for non-standard files
- [ ] Export selected data only
- [ ] Import progress indicator for large files
- [ ] Template download button
- [ ] Recent imports history
- [ ] Automatic backup before import
