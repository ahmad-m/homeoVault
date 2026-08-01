import logger from '../logger.js';
import { AppError } from '../errorFormatter.js';

/**
 * 1. CSV Export Utility
 * Converts an array of JSON records into a safe CSV format string.
 * @param {Array<Object>} data - Array of objects to export
 * @param {Array<string>} [fields] - Target fields to include (defaults to keys of first object)
 * @returns {string} CSV formatted text
 */
export const exportToCsv = (data, fields = null) => {
  try {
    if (!data || data.length === 0) return '';
    
    const targetFields = fields || Object.keys(data[0]);
    
    // Create Header Row
    const headerRow = targetFields.map(f => `"${f.replace(/"/g, '""')}"`).join(',');
    
    // Create Data Rows
    const dataRows = data.map(record => {
      return targetFields.map(field => {
        let value = record[field];
        if (value === undefined || value === null) value = '';
        
        // Convert dates/objects to string
        if (value instanceof Date) value = value.toISOString();
        else if (typeof value === 'object') value = JSON.stringify(value);
        
        // Escape quotes, wrap in quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
  } catch (err) {
    logger.error('Failed to export dataset to CSV format', err);
    throw new AppError('Export to CSV format failed.', 500);
  }
};

/**
 * 2. CSV Import Utility
 * Parses a standard CSV formatted string into an array of objects.
 * @param {string} csvText - Raw CSV string
 * @returns {Array<Object>} List of parsed objects
 */
export const importFromCsv = (csvText) => {
  try {
    if (!csvText || !csvText.trim()) return [];
    
    // Split into lines while ignoring empty trailing rows
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    // Regex to split columns by commas while honoring quoted strings
    const splitCsvRow = (row) => {
      const result = [];
      let currentVal = '';
      let insideQuote = false;
      
      for (let idx = 0; idx < row.length; idx++) {
        const char = row[idx];
        
        if (char === '"') {
          if (insideQuote && row[idx + 1] === '"') {
            currentVal += '"'; // Doubled quote escapes quote
            idx++;
          } else {
            insideQuote = !insideQuote; // Toggle quote boundaries
          }
        } else if (char === ',' && !insideQuote) {
          result.push(currentVal.trim());
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      result.push(currentVal.trim());
      return result;
    };

    const headers = splitCsvRow(lines[0]);
    const parsedData = [];
    
    for (let idx = 1; idx < lines.length; idx++) {
      const columns = splitCsvRow(lines[idx]);
      if (columns.length === headers.length) {
        const item = {};
        headers.forEach((header, cIdx) => {
          item[header] = columns[cIdx];
        });
        parsedData.push(item);
      }
    }
    
    return parsedData;
  } catch (err) {
    logger.error('Failed to parse CSV upload string', err);
    throw new AppError('Import from CSV failed. Check formatting constraints.', 400);
  }
};

/**
 * 3. PDF Export Framework Interface (Skeleton Only)
 */
export class PdfExporter {
  /**
   * Generates a PDF buffer of the dataset.
   * @param {Array<Object>} data - Records
   * @param {Array<Object>} columns - Column definitions { header, key, width }
   * @param {Object} [options] - Custom margin or styling options
   * @returns {Promise<Buffer>} PDF file buffer
   */
  static async exportToPdfBuffer(data, columns, options = {}) {
    logger.info('Invoking PDF export skeleton framework...');
    throw new AppError('PDF Export helper is currently a framework skeleton. Install pdfkit to activate.', 501);
  }
}

/**
 * 4. Excel Export Framework Interface (Skeleton Only)
 */
export class ExcelExporter {
  /**
   * Generates an Excel buffer of the dataset.
   * @param {Array<Object>} data - Records
   * @param {Array<Object>} columns - Column mappings
   * @param {Object} [options] - Sheet formatting configurations
   * @returns {Promise<Buffer>} Excel workbook buffer
   */
  static async exportToExcelBuffer(data, columns, options = {}) {
    logger.info('Invoking Excel export skeleton framework...');
    throw new AppError('Excel Export helper is currently a framework skeleton. Install exceljs to activate.', 501);
  }
}

export default {
  exportToCsv,
  importFromCsv,
  PdfExporter,
  ExcelExporter
};
