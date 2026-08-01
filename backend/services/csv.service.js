import { exportToCsv } from '../utils/core/dataExporter.js';

class CsvService {
  /**
   * Generates a CSV file buffer from a dataset.
   * @param {Array<Object>} data - Report data records
   * @param {Array<Object>} columns - Column definitions { key, title }
   * @returns {Buffer} CSV binary buffer
   */
  generateBuffer(data, columns) {
    if (!data || data.length === 0) return Buffer.from('');

    const targetKeys = columns.map(c => c.key);
    
    // Map data to match header keys
    const mappedData = data.map(record => {
      const row = {};
      columns.forEach(col => {
        let val = record[col.key];
        // Format dates nicely
        if (val instanceof Date) {
          val = val.toISOString();
        }
        row[col.title] = val !== undefined && val !== null ? val : '';
      });
      return row;
    });

    const csvText = exportToCsv(mappedData, columns.map(c => c.title));
    return Buffer.from(csvText, 'utf-8');
  }
}

export default new CsvService();
