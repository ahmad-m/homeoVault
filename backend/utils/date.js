/**
 * HomeoVault - Date Utilities
 */

/**
 * Returns current timestamp in UTC ISO format.
 * @returns {string} ISO Date String
 */
export const getUtcNowString = () => new Date().toISOString();

/**
 * Converts a JS date object to a database-compatible timestamp string.
 * @param {Date|string|number} date - Date representation
 * @returns {string} ISO Date String
 */
export const formatDbTimestamp = (date) => {
  if (!date) return getUtcNowString();
  const d = new Date(date);
  return isNaN(d.getTime()) ? getUtcNowString() : d.toISOString();
};

/**
 * Validates whether a value can be converted to a valid Date.
 * @param {any} value - Value to test
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (value) => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return !isNaN(d.getTime());
  }
  return false;
};

export default {
  now: getUtcNowString,
  format: formatDbTimestamp,
  isValid: isValidDate
};
