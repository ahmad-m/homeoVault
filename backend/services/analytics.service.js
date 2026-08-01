import dashboardRepository from '../repositories/dashboard.repository.js';

class AnalyticsService {
  /**
   * Fetches core analytics datasets.
   */
  async getAnalyticsSummary() {
    const [
      categoryDistribution,
      monthlyTrends,
      topUsed,
      mostStocked,
      valuation
    ] = await Promise.all([
      dashboardRepository.getCategoryDistribution(),
      dashboardRepository.getMonthlyTrends(),
      dashboardRepository.getTopUsedMedicines(),
      dashboardRepository.getMostStockedMedicines(),
      dashboardRepository.getInventoryValuation()
    ]);

    return {
      categoryDistribution,
      monthlyTrends,
      topUsed,
      mostStocked,
      valuation
    };
  }

  /**
   * Formats datasets into Chart.js models.
   */
  async getChartDatasets() {
    const raw = await this.getAnalyticsSummary();

    // 1. Monthly Trends Chart Dataset (Bar/Line)
    const monthlyLabels = raw.monthlyTrends.map(t => t.month);
    const monthlyStockIn = raw.monthlyTrends.map(t => parseInt(t.stock_in, 10));
    const monthlyStockOut = raw.monthlyTrends.map(t => parseInt(t.stock_out, 10));

    // 2. Category Share Chart Dataset (Pie/Doughnut)
    const categoryLabels = raw.categoryDistribution.map(c => c.category_name);
    const categoryData = raw.categoryDistribution.map(c => parseInt(c.medicine_count, 10));

    // 3. Top Used Chart Dataset (Bar)
    const topUsedLabels = raw.topUsed.map(t => `${t.medicine_name} ${t.potency_name}`);
    const topUsedData = raw.topUsed.map(t => parseInt(t.total_deducted, 10));

    // 4. Most Stocked Chart Dataset (Doughnut)
    const mostStockedLabels = raw.mostStocked.map(t => `${t.medicine_name} ${t.potency_name}`);
    const mostStockedData = raw.mostStocked.map(t => parseInt(t.current_quantity, 10));

    // 5. Expiry Distribution (Mock/Calculated from summary counts)
    // Counts batches expiring within N days
    const summary = await dashboardRepository.getSummary();
    const expiryLabels = ['Expired', 'Expiring 30 Days'];
    const expiryData = [summary.expiredCount, summary.expiring30Count];

    return {
      monthly: {
        labels: monthlyLabels,
        datasets: [
          { label: 'Stock In', data: monthlyStockIn },
          { label: 'Stock Out', data: monthlyStockOut }
        ]
      },
      category: {
        labels: categoryLabels,
        data: categoryData
      },
      topUsed: {
        labels: topUsedLabels,
        data: topUsedData
      },
      mostStocked: {
        labels: mostStockedLabels,
        data: mostStockedData
      },
      expiry: {
        labels: expiryLabels,
        data: expiryData
      },
      valuation: raw.valuation
    };
  }
}

export default new AnalyticsService();
