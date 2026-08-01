import BaseRepository from './base.repository.js';

class DashboardRepository extends BaseRepository {
  constructor() {
    super('inventory', 'id');
  }

  /**
   * Compiles all dashboard KPI counts in a single payload.
   */
  async getSummary(client = null) {
    const queries = {
      totalMedicines: 'SELECT COUNT(*) FROM medicines WHERE is_active = true',
      totalInventoryItems: 'SELECT COUNT(i.id) FROM inventory i JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE m.is_active = true AND mp.is_active = true',
      totalAvailableStock: 'SELECT COALESCE(SUM(ib.available_quantity), 0) FROM inventory_batches ib JOIN inventory i ON ib.inventory_id = i.id JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true',
      lowStockCount: 'SELECT COUNT(i.id) FROM inventory i JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE i.current_quantity <= i.reorder_level AND i.current_quantity > 0 AND m.is_active = true AND mp.is_active = true',
      outOfStockCount: 'SELECT COUNT(i.id) FROM inventory i JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE i.current_quantity = 0 AND m.is_active = true AND mp.is_active = true',
      expiredCount: 'SELECT COUNT(ib.id) FROM inventory_batches ib JOIN inventory i ON ib.inventory_id = i.id JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE ib.expiry_date <= CURRENT_DATE AND ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true',
      expiring30Count: 'SELECT COUNT(ib.id) FROM inventory_batches ib JOIN inventory i ON ib.inventory_id = i.id JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE ib.expiry_date > CURRENT_DATE AND ib.expiry_date <= CURRENT_DATE + INTERVAL \'30 days\' AND ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true',
      todayStockIn: 'SELECT COALESCE(SUM(st.quantity), 0) FROM stock_transactions st JOIN inventory_batches ib ON st.inventory_batch_id = ib.id JOIN inventory i ON ib.inventory_id = i.id JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE st.transaction_type = \'STOCK_IN\' AND st.transaction_date::date = CURRENT_DATE AND m.is_active = true AND mp.is_active = true',
      todayStockOut: 'SELECT COALESCE(ABS(SUM(st.quantity)), 0) FROM stock_transactions st JOIN inventory_batches ib ON st.inventory_batch_id = ib.id JOIN inventory i ON ib.inventory_id = i.id JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id JOIN medicines m ON mp.medicine_id = m.id WHERE st.transaction_type = \'STOCK_OUT\' AND st.transaction_date::date = CURRENT_DATE AND m.is_active = true AND mp.is_active = true',
      totalSuppliers: 'SELECT COUNT(*) FROM suppliers WHERE is_active = true',
      totalCategories: 'SELECT COUNT(*) FROM medicine_categories WHERE is_active = true'
    };

    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
      const res = await this.executeQuery(sql, [], client);
      results[key] = parseInt(res.rows[0].count || res.rows[0].coalesce || 0, 10);
    }

    return results;
  }

  /**
   * Fetches the latest 5 transactions.
   */
  async getRecentActivity(client = null) {
    const text = `
      SELECT st.*, ib.batch_number, m.name as medicine_name, p.name as potency_name,
             u.first_name, u.last_name
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      JOIN users u ON st.performed_by = u.id
      WHERE m.is_active = true AND mp.is_active = true
      ORDER BY st.transaction_date DESC
      LIMIT 5
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Fetches category distribution data.
   */
  async getCategoryDistribution(client = null) {
    const text = `
      SELECT c.name as category_name, COUNT(m.id) as medicine_count
      FROM medicine_categories c
      LEFT JOIN medicines m ON c.id = m.category_id AND m.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      ORDER BY medicine_count DESC
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Calculates monthly stock-in / stock-out quantities for the last 6 months.
   */
  async getMonthlyTrends(client = null) {
    const text = `
      SELECT TO_CHAR(st.transaction_date, 'YYYY-MM') as month,
             SUM(CASE WHEN st.transaction_type = 'STOCK_IN' THEN st.quantity ELSE 0 END) as stock_in,
             SUM(CASE WHEN st.transaction_type = 'STOCK_OUT' THEN ABS(st.quantity) ELSE 0 END) as stock_out
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '6 months'
        AND m.is_active = true AND mp.is_active = true
      GROUP BY TO_CHAR(st.transaction_date, 'YYYY-MM')
      ORDER BY month ASC
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Fetches top used medicines based on stock-out transactions volumes.
   */
  async getTopUsedMedicines(client = null) {
    const text = `
      SELECT m.name as medicine_name, p.name as potency_name, SUM(ABS(st.quantity)) as total_deducted
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      WHERE st.transaction_type = 'STOCK_OUT' AND m.is_active = true AND mp.is_active = true
      GROUP BY m.id, m.name, p.name
      ORDER BY total_deducted DESC
      LIMIT 5
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Calculates the valuation of the inventory using purchase cost and MRP.
   */
  async getInventoryValuation(client = null) {
    const text = `
      SELECT 
        COALESCE(SUM(ib.available_quantity * ib.purchase_price), 0) as total_purchase_value,
        COALESCE(SUM(ib.available_quantity * ib.mrp), 0) as total_mrp_value
      FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      WHERE ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true
    `;
    const result = await this.executeQuery(text, [], client);
    return {
      totalPurchaseValue: parseFloat(result.rows[0].total_purchase_value),
      totalMrpValue: parseFloat(result.rows[0].total_mrp_value)
    };
  }

  /**
   * Fetches most stocked medicines based on aggregate balances.
   */
  async getMostStockedMedicines(client = null) {
    const text = `
      SELECT m.name as medicine_name, p.name as potency_name, i.current_quantity
      FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      WHERE m.is_active = true AND mp.is_active = true
      ORDER BY i.current_quantity DESC
      LIMIT 5
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }
}

export const dashboardRepository = new DashboardRepository();
export default dashboardRepository;
