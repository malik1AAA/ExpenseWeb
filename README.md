# FinanceFlow - Personal Finance Manager

A modern personal finance management application built with React, Vite, and Tailwind CSS.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Sidebar, Header, Layout)
│   ├── common/          # Reusable UI components (Button, Card, StatCard, etc.)
│   ├── dashboard/       # Dashboard-specific components
│   ├── expenses/        # Expenses page components
│   ├── reports/         # Reports page components
│   └── debts/           # Debts page components
│
├── pages/               # Page components (one per route)
│   ├── Dashboard.jsx
│   ├── Expenses.jsx
│   ├── Reports.jsx
│   ├── Debts.jsx
│   └── Settings.jsx
│
├── services/            # Business logic and data operations
│   ├── excelService.js      # Excel import/export (SheetJS)
│   ├── calculationService.js # Financial calculations
│   ├── expenseService.js    # Expense operations
│   └── debtService.js       # Debt operations
│
├── context/             # React Context for state management
│   └── FinanceContext.jsx   # Global finance state
│
├── hooks/               # Custom React hooks
│   └── useFinance.js       # Finance data and actions hook
│
├── utils/               # Utility functions
│   ├── dateUtils.js        # Date formatting and calculations
│   └── currencyUtils.js    # Currency formatting
│
├── data/                # Static data and samples
│   └── sampleData.js       # Sample data for development
│
├── App.jsx              # Main app component with routing
├── main.jsx             # App entry point
└── index.css            # Global styles (Tailwind)
```

## Architecture Principles

- **Separation of Concerns**: UI components are separate from business logic
- **Reusable Components**: Common UI elements are extracted into `components/common/`
- **Feature-based Organization**: Each feature has its own component folder
- **Service Layer**: Business logic is isolated in services
- **Context API**: Global state management without external dependencies
- **Custom Hooks**: Encapsulate complex logic and data access

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Chart library (ready for implementation)
- **SheetJS (xlsx)** - Excel file handling
- **date-fns** - Date utilities

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Data Source

The application uses Excel files as the primary data source. Import and export functionality is handled by the Excel service using SheetJS.

## Next Steps

- Implement actual chart rendering with Recharts
- Add expense creation/editing forms
- Implement Excel import/export UI
- Add debt payment tracking
- Implement filtering and search functionality
- Add data persistence (localStorage or file-based)
