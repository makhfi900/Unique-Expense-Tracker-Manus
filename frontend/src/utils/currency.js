/**
 * Currency formatting utility for Pakistani Rupees (PKR)
 */

/**
 * Normalize input to a finite number
 * @param {*} value - The value to normalize
 * @returns {number|null} Normalized number or null if invalid
 */
const normalizeAmount = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? null : num;
};

/**
 * Format amount as Pakistani Rupees with proper localization
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "Rs 1,23,456.78")
 */
export const formatCurrency = (amount) => {
  const num = normalizeAmount(amount);
  if (num === null) {
    return 'Rs 0.00';
  }

  return `Rs ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format amount as Pakistani Rupees without the Rs symbol
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted amount string (e.g., "1,23,456.78")
 */
export const formatAmount = (amount) => {
  const num = normalizeAmount(amount);
  if (num === null) {
    return '0.00';
  }

  return num.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format large amounts in compact form for better mobile readability
 * @param {number|string} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include Rs symbol (default: true)
 * @returns {string} Compact formatted string (e.g., "Rs 165.8 Lakh", "Rs 5.4K", "Rs 850")
 */
export const formatCompactCurrency = (amount, includeSymbol = true) => {
  const num = normalizeAmount(amount);
  if (num === null) {
    return includeSymbol ? 'Rs 0' : '0';
  }

  const absAmount = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const prefix = includeSymbol ? 'Rs ' : '';

  let formatted;
  if (absAmount >= 100000) {
    // 1 Lakh+ -> show as "5.4 Lakh" or "165.8 Lakh" for crores
    formatted = `${(absAmount / 100000).toFixed(1)} Lakh`;
  } else if (absAmount >= 10000) {
    // 10K+ -> show as "54K"
    formatted = `${(absAmount / 1000).toFixed(0)}K`;
  } else if (absAmount >= 1000) {
    // 1K+ -> show as "5.4K"
    formatted = `${(absAmount / 1000).toFixed(1)}K`;
  } else {
    // Less than 1000 -> show full number
    formatted = absAmount.toFixed(0);
  }

  // Remove .0 suffixes for cleaner display
  formatted = formatted.replace('.0K', 'K').replace('.0 Lakh', ' Lakh');

  return `${prefix}${sign}${formatted}`;
};

/**
 * Format amount for chart display - shorter than compact, good for labels
 * @param {number|string} amount - The amount to format
 * @returns {string} Short formatted string (e.g., "165.8 Lakh", "54K", "850")
 */
export const formatChartValue = (amount) => {
  return formatCompactCurrency(amount, false);
};

/**
 * Format currency with smart precision based on amount size
 * Good for tooltips where you want more detail
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted with appropriate precision
 */
export const formatTooltipCurrency = (amount) => {
  const num = normalizeAmount(amount);
  if (num === null) {
    return 'Rs 0';
  }

  const absAmount = Math.abs(num);

  if (absAmount >= 100000) {
    // Lakhs: show 2 decimal places
    return `Rs ${(num / 100000).toFixed(2)} Lakh`;
  } else if (absAmount >= 1000) {
    // Thousands: show full number with commas
    return `Rs ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
  } else {
    // Small amounts: show with 2 decimals
    return `Rs ${num.toFixed(2)}`;
  }
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string (e.g., "Rs 1,23,456.78" or "1,23,456.78")
 * @returns {number} Parsed amount
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove Rs symbol, spaces, and commas
  const cleanString = currencyString.replace(/Rs\s?|,/g, '');
  const parsed = parseFloat(cleanString);

  return isNaN(parsed) ? 0 : parsed;
};
