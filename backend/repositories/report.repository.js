import BaseRepository from './base.repository.js';

class ReportRepository extends BaseRepository {
  constructor() {
    super('inventory', 'id');
  }

  /**
   * Helper to parse SQL date boundaries.
   */
  _applyDateRange(whereClauses, params, paramIdx, dateCol, startDate, endDate) {
    let currentIdx = paramIdx;
    if (startDate) {
      whereClauses.push(`${dateCol} >= $${currentIdx++}`);
      params.push(new Date(startDate));
    }
    if (endDate) {
      // Set to end of the day boundary (23:59:59)
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClauses.push(`${dateCol} <= $${currentIdx++}`);
      params.push(end);
    }
    return currentIdx;
  }

  /**
   * 1. Current Inventory Report
   */
  async getInventoryReport(filters = {}, { limit = 50, offset = 0 } = {}) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [
      'm.is_active = true',
      'mp.is_active = true'
    ];

    if (filters.category_id) {
      whereClauses.push(`m.category_id = $${paramIdx++}`);
      params.push(filters.category_id);
    }
    if (filters.potency_id) {
      whereClauses.push(`mp.potency_id = $${paramIdx++}`);
      params.push(filters.potency_id);
    }
    if (filters.location_id) {
      whereClauses.push(`i.default_location_id = $${paramIdx++}`);
      params.push(filters.location_id);
    }
    if (filters.search) {
      whereClauses.push(`(m.name ILIKE $${paramIdx++} OR m.latin_name ILIKE $${paramIdx - 1})`);
      params.push(`%${filters.search.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    const dataSql = `
      SELECT i.id, m.name as medicine_name, p.name as potency_name, c.name as category_name,
             i.current_quantity, i.minimum_quantity, i.reorder_level, l.name as location_name,
             i.last_updated
      FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      JOIN medicine_categories c ON m.category_id = c.id
      LEFT JOIN locations l ON i.default_location_id = l.id
      ${whereSql}
      ORDER BY m.name ASC, p.display_order ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const countSql = `
      SELECT COUNT(*) FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      ${whereSql}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const dataRes = await this.executeQuery(dataSql, queryParams);
    const countRes = await this.executeQuery(countSql, params);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * 2. Stock In / Stock Out Reports (movements)
   */
  async getStockMovementsReport(type, filters = {}, { limit = 50, offset = 0 } = {}) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [
      `st.transaction_type = $${paramIdx++}`,
      'm.is_active = true',
      'mp.is_active = true'
    ];
    params.push(type); // 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'

    if (filters.medicine_id) {
      whereClauses.push(`mp.medicine_id = $${paramIdx++}`);
      params.push(filters.medicine_id);
    }
    if (filters.supplier_id) {
      whereClauses.push(`ib.supplier_id = $${paramIdx++}`);
      params.push(filters.supplier_id);
    }
    if (filters.user_id) {
      whereClauses.push(`st.performed_by = $${paramIdx++}`);
      params.push(filters.user_id);
    }
    if (filters.batch_number) {
      whereClauses.push(`ib.batch_number ILIKE $${paramIdx++}`);
      params.push(`%${filters.batch_number.trim()}%`);
    }

    paramIdx = this._applyDateRange(whereClauses, params, paramIdx, 'st.transaction_date', filters.startDate, filters.endDate);

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const dataSql = `
      SELECT st.id, st.transaction_date, m.name as medicine_name, p.name as potency_name,
             ib.batch_number, ABS(st.quantity) as quantity, st.reference_number, st.remarks,
             u.first_name || ' ' || u.last_name as operator_name, s.name as supplier_name
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      JOIN users u ON st.performed_by = u.id
      LEFT JOIN suppliers s ON ib.supplier_id = s.id
      ${whereSql}
      ORDER BY st.transaction_date DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const countSql = `
      SELECT COUNT(*) FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      ${whereSql}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const dataRes = await this.executeQuery(dataSql, queryParams);
    const countRes = await this.executeQuery(countSql, params);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * 3. Expiry Report
   */
  async getExpiryReport(filters = {}, { limit = 50, offset = 0 } = {}) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [
      'ib.available_quantity > 0',
      'm.is_active = true',
      'mp.is_active = true'
    ];

    if (filters.expiryStatus === 'expired') {
      whereClauses.push('ib.expiry_date <= CURRENT_DATE');
    } else if (filters.expiryStatus === 'expiring_30') {
      whereClauses.push('ib.expiry_date > CURRENT_DATE AND ib.expiry_date <= CURRENT_DATE + INTERVAL \'30 days\'');
    } else if (filters.expiryStatus === 'expiring_90') {
      whereClauses.push('ib.expiry_date > CURRENT_DATE AND ib.expiry_date <= CURRENT_DATE + INTERVAL \'90 days\'');
    }

    if (filters.location_id) {
      whereClauses.push(`i.default_location_id = $${paramIdx++}`);
      params.push(filters.location_id);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const dataSql = `
      SELECT ib.id, m.name as medicine_name, p.name as potency_name, ib.batch_number,
             ib.expiry_date, ib.available_quantity, l.name as location_name, s.name as supplier_name,
             CASE WHEN ib.expiry_date <= CURRENT_DATE THEN 'EXPIRED' ELSE 'EXPIRING' END as status
      FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      LEFT JOIN locations l ON i.default_location_id = l.id
      LEFT JOIN suppliers s ON ib.supplier_id = s.id
      ${whereSql}
      ORDER BY ib.expiry_date ASC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const countSql = `
      SELECT COUNT(*) FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      ${whereSql}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const dataRes = await this.executeQuery(dataSql, queryParams);
    const countRes = await this.executeQuery(countSql, params);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * 4. Low Stock / Out of Stock Reports
   */
  async getLowStockReport(statusType = 'low', { limit = 50, offset = 0 } = {}) {
    const whereClauses = [
      'm.is_active = true',
      'mp.is_active = true'
    ];
    if (statusType === 'out') {
      whereClauses.push('i.current_quantity = 0');
    } else {
      whereClauses.push('i.current_quantity <= i.reorder_level AND i.current_quantity > 0');
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const dataSql = `
      SELECT i.id, m.name as medicine_name, p.name as potency_name, c.name as category_name,
             i.current_quantity, i.minimum_quantity, i.reorder_level, l.name as location_name
      FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      JOIN medicine_categories c ON m.category_id = c.id
      LEFT JOIN locations l ON i.default_location_id = l.id
      ${whereSql}
      ORDER BY m.name ASC
      LIMIT $1 OFFSET $2
    `;

    const countSql = `
      SELECT COUNT(*) FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      ${whereSql}
    `;

    const dataRes = await this.executeQuery(dataSql, [parseInt(limit, 10), parseInt(offset, 10)]);
    const countRes = await this.executeQuery(countSql, []);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * 5. Inventory Valuation Report
   */
  async getValuationReport({ limit = 50, offset = 0 } = {}) {
    const dataSql = `
      SELECT ib.id, m.name as medicine_name, p.name as potency_name, ib.batch_number,
             ib.available_quantity, ib.purchase_price, ib.mrp,
             (ib.available_quantity * ib.purchase_price) as total_cost_value,
             (ib.available_quantity * ib.mrp) as total_mrp_value,
             l.name as location_name
      FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      LEFT JOIN locations l ON i.default_location_id = l.id
      WHERE ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true
      ORDER BY m.name ASC
      LIMIT $1 OFFSET $2
    `;

    const countSql = `
      SELECT COUNT(ib.id) FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      WHERE ib.available_quantity > 0 AND m.is_active = true AND mp.is_active = true
    `;

    const dataRes = await this.executeQuery(dataSql, [parseInt(limit, 10), parseInt(offset, 10)]);
    const countRes = await this.executeQuery(countSql, []);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * 6. User Activity Report
   */
  async getActivityReport(filters = {}, { limit = 50, offset = 0 } = {}) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [];

    if (filters.user_id) {
      whereClauses.push(`al.created_by = $${paramIdx++}`);
      params.push(filters.user_id);
    }
    if (filters.action) {
      whereClauses.push(`al.action = $${paramIdx++}`);
      params.push(filters.action);
    }

    paramIdx = this._applyDateRange(whereClauses, params, paramIdx, 'al.created_at', filters.startDate, filters.endDate);

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const dataSql = `
      SELECT al.id, al.created_at, al.action, al.details,
             u.first_name || ' ' || u.last_name as operator_name
      FROM activity_logs al
      JOIN users u ON al.created_by = u.id
      ${whereSql}
      ORDER BY al.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const countSql = `
      SELECT COUNT(*) FROM activity_logs al
      JOIN users u ON al.created_by = u.id
      ${whereSql}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const dataRes = await this.executeQuery(dataSql, queryParams);
    const countRes = await this.executeQuery(countSql, params);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }
}

export const reportRepository = new ReportRepository();
export default reportRepository;
