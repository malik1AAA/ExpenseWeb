import { format, parseISO, isToday, isYesterday, subDays, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';

/**
 * Format a date to display string
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - date-fns format string
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format date with relative time (Today, Yesterday, etc.)
 * @param {Date|string} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  if (isYesterday(dateObj)) return 'Yesterday';
  
  return formatDate(dateObj, 'MMM dd, yyyy');
};

/**
 * Get current date as ISO string
 * @returns {string} Current date in ISO format
 */
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get start and end of current month
 * @returns {{ start: Date, end: Date }}
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  };
};

/**
 * Get array of dates for current month
 * @returns {Date[]} Array of dates
 */
export const getDaysInCurrentMonth = () => {
  const { start, end } = getCurrentMonthRange();
  return eachDayOfInterval({ start, end });
};

/**
 * Check if date is within last N days
 * @param {Date|string} date - Date to check
 * @param {number} days - Number of days
 * @returns {boolean}
 */
export const isWithinLastDays = (date, days) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const threshold = subDays(new Date(), days);
  return dateObj >= threshold;
};

/**
 * Get days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
export const getDaysBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
};
