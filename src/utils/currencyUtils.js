/**
 * Currency configuration
 * Can be updated from Settings in the future
 */
export const DEFAULT_CURRENCY = 'PKR';

/**
 * Currency symbols and formatting rules
 */
export const CURRENCY_CONFIG = {
  PKR: {
    symbol: 'Rs.',
    locale: 'en-PK',
    decimals: 0,
    symbolPosition: 'before', // 'before' or 'after'
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

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'PKR')
 * @returns {string} Formatted currency string (e.g., "Rs. 1,250")
 */
export const formatCurrency = (amount, currency = DEFAULT_CURRENCY) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
    return `${config.symbol} 0`;
  }
  
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
  
  // Format the number with thousand separators
  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
  
  // Add currency symbol
  if (config.symbolPosition === 'before') {
    return `${config.symbol} ${formattedNumber}`;
  } else {
    return `${formattedNumber} ${config.symbol}`;
  }
};

/**
 * Format amount with sign (+ or -)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'PKR')
 * @returns {string} Formatted string with sign
 */
export const formatCurrencyWithSign = (amount, currency = DEFAULT_CURRENCY) => {
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
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = DEFAULT_CURRENCY) => {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
  return config.symbol;
};

/**
 * Get all available currencies
 * @returns {Array} Array of currency codes
 */
export const getAvailableCurrencies = () => {
  return Object.keys(CURRENCY_CONFIG);
};

/**
 * Get currency configuration
 * @param {string} currency - Currency code
 * @returns {Object} Currency configuration object
 */
export const getCurrencyConfig = (currency = DEFAULT_CURRENCY) => {
  return CURRENCY_CONFIG[currency] || CURRENCY_CONFIG[DEFAULT_CURRENCY];
};
