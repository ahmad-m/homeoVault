import BaseRepository from './base.repository.js';

class StockTransactionRepository extends BaseRepository {
  constructor() {
    super('stock_transactions', 'id');
  }

  /**
   * Retrieves transaction log history with details of the remedy, potency, and operator.
   */
  async listHistory({ medicine_id = null, type = null, limit = 20, offset = 0 }, client = null) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [
      'm.is_active = true',
      'mp.is_active = true'
    ];

    if (medicine_id) {
      whereClauses.push(`i.medicine_potency_id IN (SELECT id FROM medicine_potencies WHERE medicine_id = $${paramIdx++})`);
      params.push(medicine_id);
    }

    if (type) {
      whereClauses.push(`st.transaction_type = $${paramIdx++}`);
      params.push(type);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) 
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      ${whereSql}
    `;

    const dataSql = `
      SELECT st.*, ib.batch_number, m.name as medicine_name, p.name as potency_name,
             u.first_name, u.last_name
      FROM stock_transactions st
      JOIN inventory_batches ib ON st.inventory_batch_id = ib.id
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      JOIN users u ON st.performed_by = u.id
      ${whereSql}
      ORDER BY st.transaction_date DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];

    const dataResult = await this.executeQuery(dataSql, queryParams, client);
    const countResult = await this.executeQuery(countSql, params, client);

    return {
      records: dataResult.rows,
      totalRecords: parseInt(countResult.rows[0].count, 10)
    };
  }
}

export const stockTransactionRepository = new StockTransactionRepository();
export default stockTransactionRepository;
