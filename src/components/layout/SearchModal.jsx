import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Receipt, CreditCard, Tag } from 'lucide-react';
import { useFinance } from '../../hooks/useFinance';
import { COLUMNS } from '../../config/excelSchema';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  const { expenses, debts, categories } = useFinance();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchTimeout = setTimeout(() => {
      performSearch(query.toLowerCase());
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, expenses, debts, categories]);

  const performSearch = (searchTerm) => {
    const searchResults = [];

    // Search expenses
    expenses.forEach(expense => {
      const description = expense[COLUMNS.EXPENSES.DESCRIPTION]?.toLowerCase() || '';
      const categoryName = categories.find(c => 
        c[COLUMNS.CATEGORIES.CATEGORY_ID] === expense[COLUMNS.EXPENSES.CATEGORY]
      )?.[COLUMNS.CATEGORIES.CATEGORY_NAME] || expense[COLUMNS.EXPENSES.CATEGORY];

      if (description.includes(searchTerm) || categoryName.toLowerCase().includes(searchTerm)) {
        searchResults.push({
          type: 'expense',
          id: expense[COLUMNS.EXPENSES.EXPENSE_ID],
          title: expense[COLUMNS.EXPENSES.DESCRIPTION],
          subtitle: `${categoryName} • ${formatDate(expense[COLUMNS.EXPENSES.DATE])}`,
          amount: formatCurrency(expense[COLUMNS.EXPENSES.AMOUNT]),
          icon: Receipt,
          route: '/expenses',
        });
      }
    });

    // Search debts
    debts.forEach(debt => {
      const person = debt[COLUMNS.DEBTS.PERSON]?.toLowerCase() || '';
      const category = debt[COLUMNS.DEBTS.DEBT_CATEGORY]?.toLowerCase() || '';

      if (person.includes(searchTerm) || category.includes(searchTerm)) {
        searchResults.push({
          type: 'debt',
          id: debt[COLUMNS.DEBTS.DEBT_ID],
          title: debt[COLUMNS.DEBTS.PERSON],
          subtitle: `${debt[COLUMNS.DEBTS.DIRECTION]} • ${debt[COLUMNS.DEBTS.DEBT_CATEGORY]} • ${formatDate(debt[COLUMNS.DEBTS.DATE])}`,
          amount: formatCurrency(debt[COLUMNS.DEBTS.ORIGINAL_AMOUNT]),
          icon: CreditCard,
          route: '/debts',
        });
      }
    });

    // Search categories
    categories.forEach(category => {
      const name = category[COLUMNS.CATEGORIES.CATEGORY_NAME]?.toLowerCase() || '';
      const id = category[COLUMNS.CATEGORIES.CATEGORY_ID]?.toLowerCase() || '';

      if (name.includes(searchTerm) || id.includes(searchTerm)) {
        searchResults.push({
          type: 'category',
          id: category[COLUMNS.CATEGORIES.CATEGORY_ID],
          title: category[COLUMNS.CATEGORIES.CATEGORY_NAME],
          subtitle: `${category[COLUMNS.CATEGORIES.TYPE]} category`,
          icon: Tag,
          route: '/settings',
        });
      }
    });

    // Limit results to prevent performance issues
    setResults(searchResults.slice(0, 20));
  };

  const handleResultClick = (result) => {
    navigate(result.route);
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 z-50 max-w-2xl mx-auto px-4 animate-fade-in">
        <div className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-200">
            <Search className="w-5 h-5 text-surface-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search expenses, debts, categories..."
              className="flex-1 bg-transparent outline-none text-surface-900 placeholder:text-surface-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-surface-500" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-8 text-center text-surface-500">
                Searching...
              </div>
            ) : results.length === 0 && query.trim() ? (
              <div className="p-8 text-center text-surface-500">
                No results found for "{query}"
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-surface-500">
                Start typing to search...
              </div>
            ) : (
              <div className="divide-y divide-surface-200">
                {results.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}-${index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-50 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-surface-100">
                      <result.icon className="w-4 h-4 text-surface-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-surface-900 truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-surface-500 truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    {result.amount && (
                      <div className="text-sm font-semibold text-surface-900">
                        {result.amount}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-surface-200 bg-surface-50 text-xs text-surface-500">
            <span className="font-medium">Tip:</span> Press <kbd className="px-1.5 py-0.5 bg-surface-200 rounded">Esc</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
}
