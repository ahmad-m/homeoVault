import reportRepository from '../repositories/report.repository.js';
import { AppError } from '../utils/errorFormatter.js';

class ReportService {
  /**
   * Dispatches and maps report queries based on target types.
   * @param {string} type - Report key (e.g. 'inventory', 'stock-in', 'expiry', etc.)
   * @param {Object} filters - Custom query filter parameters
   * @param {Object} pagination - Pagination parameters { limit, offset }
   * @returns {Promise<Object>} Mapped list records and total counts
   */
  async generateReport(type, filters = {}, pagination = { limit: 50, offset: 0 }) {
    switch (type) {
      case 'inventory':
        return await reportRepository.getInventoryReport(filters, pagination);
      
      case 'stock-in':
        return await reportRepository.getStockMovementsReport('STOCK_IN', filters, pagination);
      
      case 'stock-out':
        return await reportRepository.getStockMovementsReport('STOCK_OUT', filters, pagination);
      
      case 'expiry':
        return await reportRepository.getExpiryReport(filters, pagination);
      
      case 'low-stock':
        return await reportRepository.getLowStockReport('low', pagination);

      case 'out-of-stock':
        return await reportRepository.getLowStockReport('out', pagination);
      
      case 'valuation':
        return await reportRepository.getValuationReport(pagination);
      
      case 'activity':
        return await reportRepository.getActivityReport(filters, pagination);

      default:
        throw new AppError(`Report type [${type}] is not recognized.`, 400);
    }
  }
}

export default new ReportService();
