import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * SortableHeader - Reusable component for sortable table column headers
 * 
 * @param {Object} props
 * @param {string} props.label - Column header label
 * @param {string} props.field - Field name for sorting
 * @param {string|null} props.sortState - Current sort state: 'asc', 'desc', or null
 * @param {Function} props.onSort - Callback when header is clicked
 * @param {string} props.align - Text alignment: 'left', 'right', 'center'
 * @param {string} props.className - Additional CSS classes
 */
export default function SortableHeader({ 
  label, 
  field, 
  sortState, 
  onSort, 
  align = 'left',
  className = ''
}) {
  const isSorted = sortState !== null;
  const isAscending = sortState === 'asc';
  const isDescending = sortState === 'desc';

  // Determine aria-sort value
  const ariaSort = isSorted 
    ? (isAscending ? 'ascending' : 'descending')
    : 'none';

  // Alignment classes
  const alignClasses = {
    left: 'text-left justify-start',
    right: 'text-right justify-end',
    center: 'text-center justify-center',
  };

  return (
    <th 
      className={`px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wider cursor-pointer hover:bg-surface-100 transition-colors select-none ${alignClasses[align]} ${className}`}
      onClick={() => onSort(field)}
      aria-sort={ariaSort}
      role="columnheader"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSort(field);
        }
      }}
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span>{label}</span>
        <span className="inline-flex items-center" aria-hidden="true">
          {isAscending && <ArrowUp className="w-3.5 h-3.5 text-primary-600" />}
          {isDescending && <ArrowDown className="w-3.5 h-3.5 text-primary-600" />}
          {!isSorted && <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
        </span>
      </span>
    </th>
  );
}
