import dashboardRepository from '../repositories/dashboard.repository.js';
import inventoryRepository from '../repositories/inventory.repository.js';

class DashboardService {
  /**
   * Fetches the overall KPIs count summaries.
   */
  async getSummaryMetrics() {
    return await dashboardRepository.getSummary();
  }

  /**
   * Fetches latest stock movement activities.
   */
  async getRecentActivities() {
    return await dashboardRepository.getRecentActivity();
  }

  /**
   * Fetches low stock items.
   */
  async getLowStockDetails() {
    return await inventoryRepository.getLowStock();
  }

  /**
   * Fetches expiring batches detail lists.
   */
  async getExpiryDetails() {
    const [expired, expiring30, expiring60, expiring90] = await Promise.all([
      inventoryRepository.getExpiringBatches(0),    // Expired already
      inventoryRepository.getExpiringBatches(30),   // Expiring in 30 days
      inventoryRepository.getExpiringBatches(60),   // Expiring in 60 days
      inventoryRepository.getExpiringBatches(90)    // Expiring in 90 days
    ]);

    // Exclude expired from expiring lists to keep categories distinct
    const expiredIds = new Set(expired.map(b => b.id));
    const filterExpired = list => list.filter(b => !expiredIds.has(b.id));

    return {
      expired,
      expiring30: filterExpired(expiring30),
      expiring60: filterExpired(expiring60).filter(b => !new Set(expiring30.map(x => x.id)).has(b.id)),
      expiring90: filterExpired(expiring90).filter(b => !new Set(expiring60.map(x => x.id)).has(b.id))
    };
  }
}

export default new DashboardService();
