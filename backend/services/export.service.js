import csvService from './csv.service.js';
import excelService from './excel.service.js';
import pdfService from './pdf.service.js';
import { AppError } from '../utils/errorFormatter.js';

class ExportService {
  /**
   * Orchestrates report exports into various formats.
   * @param {string} format - 'csv' | 'excel' | 'pdf'
   * @param {string} title - Report title
   * @param {Array<Object>} data - Report dataset records
   * @param {Array<Object>} columns - Column definitions { key, title }
   * @param {string} [operatorName] - User performing the export
   * @returns {Object} { buffer, mimeType, filename }
   */
  exportData(format, title, data, columns, operatorName = 'System') {
    if (!data || data.length === 0) {
      throw new AppError('Cannot export an empty report dataset.', 400);
    }

    const cleanTitle = title.replace(/\s+/g, '_').toLowerCase();
    const timestamp = Date.now();

    switch (format) {
      case 'csv':
        return {
          buffer: csvService.generateBuffer(data, columns),
          mimeType: 'text/csv',
          filename: `${cleanTitle}_${timestamp}.csv`
        };

      case 'excel':
        return {
          buffer: excelService.generateBuffer(data, columns),
          mimeType: 'application/vnd.ms-excel',
          filename: `${cleanTitle}_${timestamp}.xls`
        };

      case 'pdf':
        return {
          buffer: pdfService.generateBuffer(title, data, columns, operatorName),
          mimeType: 'application/pdf',
          filename: `${cleanTitle}_${timestamp}.pdf`
        };

      default:
        throw new AppError(`Format [${format}] is not supported for exports.`, 400);
    }
  }
}

export default new ExportService();
