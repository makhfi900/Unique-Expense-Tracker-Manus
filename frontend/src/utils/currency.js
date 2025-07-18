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