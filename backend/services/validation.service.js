/**
 * HomeoVault - Medicine Master Validation Service
 */

class ValidationService {
  /**
   * Validates a single medicine record row.
   * @param {Object} row - Medicine details key/value object
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validateMedicineRow(row) {
    const errors = [];

    // 1. Validate Name
    if (!row.name || !String(row.name).trim()) {
      errors.push('Medicine Name is a mandatory required field.');
    } else if (String(row.name).length > 255) {
      errors.push('Medicine Name cannot exceed 255 characters.');
    }

    // 2. Validate Category
    if (!row.category || !String(row.category).trim()) {
      errors.push('Category is a mandatory required field.');
    }

    // 3. Validate Potencies (must be array or comma-separated string)
    if (row.potencies) {
      if (typeof row.potencies !== 'string' && !Array.isArray(row.potencies)) {
        errors.push('Default Potencies field format is invalid (must be string list or array).');
      }
    }

    // 4. Validate Minimum Stock limits
    if (row.min_stock !== undefined && row.min_stock !== null && row.min_stock !== '') {
      const minStockNum = Number(row.min_stock);
      if (isNaN(minStockNum) || minStockNum < 0) {
        errors.push('Minimum Stock must be a positive integer.');
      }
    }

    // 5. Check String lengths
    if (row.latin_name && String(row.latin_name).length > 255) {
      errors.push('Latin Name cannot exceed 255 characters.');
    }
    if (row.common_name && String(row.common_name).length > 255) {
      errors.push('Common Name cannot exceed 255 characters.');
    }
    if (row.short_name && String(row.short_name).length > 100) {
      errors.push('Short Name cannot exceed 100 characters.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new ValidationService();
