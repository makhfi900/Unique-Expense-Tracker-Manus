/**
 * Currency formatting utility for Pakistani Rupees (PKR)
 */

/**
 * Format amount as Pakistani Rupees with proper localization
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "Rs 1,23,456.78")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs 0.00';
  }

  return `Rs ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format amount as Pakistani Rupees without the Rs symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount string (e.g., "1,23,456.78")
 */
export const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }

  return amount.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format large amounts in compact form for better mobile readability
 * @param {number} amount - The amount to format
 * @param {boolean} includeSymbol - Whether to include Rs symbol (default: true)
 * @returns {string} Compact formatted string (e.g., "Rs 16.6M", "Rs 5.4K", "Rs 850")
 */
export const formatCompactCurrency = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return includeSymbol ? 'Rs 0' : '0';
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const prefix = includeSymbol ? 'Rs ' : '';

  let formatted;
  if (absAmount >= 10000000) {
    // 10 Million+ -> show as "16.6M" (crore equivalent)
    formatted = `${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000000) {
    // 1 Million+ -> show as "1.5M"
    formatted = `${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 100000) {
    // 100K+ (Lakh) -> show as "5.4L" or "540K"
    formatted = `${(absAmount / 100000).toFixed(1)}L`;
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
  formatted = formatted.replace('.0K', 'K').replace('.0M', 'M').replace('.0L', 'L');

  return `${prefix}${sign}${formatted}`;
};

/**
 * Format amount for chart display - shorter than compact, good for labels
 * @param {number} amount - The amount to format
 * @returns {string} Short formatted string (e.g., "16.6M", "540K", "850")
 */
export const formatChartValue = (amount) => {
  return formatCompactCurrency(amount, false);
};

/**
 * Format currency with smart precision based on amount size
 * Good for tooltips where you want more detail
 * @param {number} amount - The amount to format
 * @returns {string} Formatted with appropriate precision
 */
export const formatTooltipCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs 0';
  }

  const absAmount = Math.abs(amount);

  if (absAmount >= 1000000) {
    // Millions: show 2 decimal places
    return `Rs ${(amount / 1000000).toFixed(2)}M`;
  } else if (absAmount >= 100000) {
    // Lakhs: show 2 decimal places
    return `Rs ${(amount / 100000).toFixed(2)}L`;
  } else if (absAmount >= 1000) {
    // Thousands: show full number with commas
    return `Rs ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
  } else {
    // Small amounts: show with 2 decimals
    return `Rs ${amount.toFixed(2)}`;
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