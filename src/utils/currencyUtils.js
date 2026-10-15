/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format amount with sign (+ or -)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted string with sign
 */
export const formatCurrencyWithSign = (amount, currency = 'USD') => {
  const formatted = formatCurrency(Math.abs(amount), currency);
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatted}`;
};

/**
 * Parse currency string to number
 * @param {string} value - Currency string (e.g., "$1,234.56")
 * @returns {number} Parsed number
 */
export const parseCurrency = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const cleaned = String(value)
    .replace(/[^0-9.-]/g, '')
    .replace(/,/g, '');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculate percentage change
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Default currency configuration
 */
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};
