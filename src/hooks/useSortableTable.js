import { useState, useMemo, useCallback } from 'react';

/**
 * useSortableTable - Custom hook for managing table sorting state and logic
 * 
 * @param {Array} data - Array of data items to sort
 * @param {string} defaultSortField - Default field to sort by
 * @param {string} defaultSortDirection - Default sort direction ('asc' or 'desc')
 * @returns {Object} Sorting state and handlers
 */
export const useSortableTable = (data, defaultSortField = null, defaultSortDirection = 'desc') => {
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);

  /**
   * Handle sort click on a column header
   * - If clicking the same column, toggle direction
   * - If clicking a different column, sort by that column descending
   */
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  /**
   * Get the current sort state for a specific field
   * Returns: 'asc', 'desc', or null (if not sorted)
   */
  const getSortState = useCallback((field) => {
    if (sortField !== field) return null;
    return sortDirection;
  }, [sortField, sortDirection]);

  /**
   * Sort data based on current sort field and direction
   * Supports different data types: date, number, string
   */
  const sortedData = useMemo(() => {
    if (!sortField || !data || data.length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Detect data type and sort accordingly
      const isDate = sortField.toLowerCase().includes('date') || 
                     (aVal instanceof Date || bVal instanceof Date) ||
                     (typeof aVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aVal));
      
      const isNumber = typeof aVal === 'number' || typeof bVal === 'number' ||
                       sortField.toLowerCase().includes('amount') ||
                       sortField.toLowerCase().includes('total') ||
                       sortField.toLowerCase().includes('count') ||
                       sortField.toLowerCase().includes('average') ||
                       sortField.toLowerCase().includes('remaining') ||
                       sortField.toLowerCase().includes('percentage');

      // Sort by date
      if (isDate) {
        const dateA = aVal instanceof Date ? aVal : new Date(aVal);
        const dateB = bVal instanceof Date ? bVal : new Date(bVal);
        
        // Handle invalid dates
        if (isNaN(dateA.getTime())) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(dateB.getTime())) return sortDirection === 'asc' ? -1 : 1;
        
        const comparison = dateA.getTime() - dateB.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Sort by number
      if (isNumber) {
        const numA = typeof aVal === 'number' ? aVal : parseFloat(aVal) || 0;
        const numB = typeof bVal === 'number' ? bVal : parseFloat(bVal) || 0;
        const comparison = numA - numB;
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      // Sort by string (case-insensitive)
      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      const comparison = strA.localeCompare(strB);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSort,
    getSortState,
    sortedData,
  };
};
