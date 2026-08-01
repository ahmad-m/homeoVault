import BaseRepository from './base.repository.js';

class InventoryRepository extends BaseRepository {
  constructor() {
    super('inventory', 'id');
  }

  /**
   * Find inventory row by medicine_potency_id link.
   */
  async findByMedicinePotency(medicinePotencyId, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE medicine_potency_id = $1 LIMIT 1`;
    const result = await this.executeQuery(text, [medicinePotencyId], client);
    return result.rows[0] || null;
  }

  /**
   * Lists inventory aggregates with joined medicine, category, potency, and location details.
   */
  async listInventory({ query = '', category_id = null, location_id = null, status = '', limit = 10, offset = 0 }, client = null) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [
      'm.is_active = true',
      'mp.is_active = true'
    ];

    if (query && query.trim()) {
      const searchParam = `%${query.trim()}%`;
      const queryIdx = paramIdx++;
      params.push(searchParam);
      whereClauses.push(`(m.name ILIKE $${queryIdx} OR m.latin_name ILIKE $${queryIdx} OR m.short_name ILIKE $${queryIdx})`);
    }

    if (category_id) {
      whereClauses.push(`m.category_id = $${paramIdx++}`);
      params.push(category_id);
    }

    if (location_id) {
      whereClauses.push(`i.default_location_id = $${paramIdx++}`);
      params.push(location_id);
    }

    // Status Filters
    if (status === 'low_stock') {
      whereClauses.push('i.current_quantity <= i.reorder_level');
    } else if (status === 'out_of_stock') {
      whereClauses.push('i.current_quantity = 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) 
      FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      ${whereSql}
    `;

    const dataSql = `
      SELECT i.*, m.id as medicine_id, m.name as medicine_name, m.latin_name,
             p.name as potency_name, c.name as category_name, l.name as location_name
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

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];

    const dataResult = await this.executeQuery(dataSql, queryParams, client);
    const countResult = await this.executeQuery(countSql, params, client);

    return {
      records: dataResult.rows,
      totalRecords: parseInt(countResult.rows[0].count, 10)
    };
  }

  /**
   * Find a batch by inventory link and batch number.
   */
  async findBatchByNumber(inventoryId, batchNumber, client = null) {
    const text = `
      SELECT * FROM inventory_batches 
      WHERE inventory_id = $1 AND LOWER(batch_number) = LOWER($2) 
      LIMIT 1
    `;
    const result = await this.executeQuery(text, [inventoryId, batchNumber.trim()], client);
    return result.rows[0] || null;
  }

  /**
   * Find a batch by ID.
   */
  async findBatchById(batchId, client = null) {
    const text = `
      SELECT ib.*, i.medicine_potency_id 
      FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      WHERE ib.id = $1 LIMIT 1
    `;
    const result = await this.executeQuery(text, [batchId], client);
    return result.rows[0] || null;
  }

  /**
   * Find all active batches for an inventory item.
   */
  async findBatchesByInventoryId(inventoryId, client = null) {
    const text = `
      SELECT ib.*, s.name as supplier_name 
      FROM inventory_batches ib
      LEFT JOIN suppliers s ON ib.supplier_id = s.id
      WHERE ib.inventory_id = $1 AND ib.available_quantity > 0
      ORDER BY ib.expiry_date ASC
    `;
    const result = await this.executeQuery(text, [inventoryId], client);
    return result.rows;
  }

  /**
   * Returns list of low stock inventory items.
   */
  async getLowStock(client = null) {
    const text = `
      SELECT i.*, m.name as medicine_name, p.name as potency_name, l.name as location_name
      FROM inventory i
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      LEFT JOIN locations l ON i.default_location_id = l.id
      WHERE i.current_quantity <= i.reorder_level AND m.is_active = true AND mp.is_active = true
      ORDER BY m.name ASC
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Returns list of batches expiring within N days.
   */
  async getExpiringBatches(daysThreshold = 30, client = null) {
    const text = `
      SELECT ib.*, m.name as medicine_name, p.name as potency_name, i.current_quantity
      FROM inventory_batches ib
      JOIN inventory i ON ib.inventory_id = i.id
      JOIN medicine_potencies mp ON i.medicine_potency_id = mp.id
      JOIN medicines m ON mp.medicine_id = m.id
      JOIN potencies p ON mp.potency_id = p.id
      WHERE ib.expiry_date <= CURRENT_DATE + (CAST($1 AS INTEGER) * INTERVAL '1 day')
        AND ib.available_quantity > 0
        AND m.is_active = true AND mp.is_active = true
      ORDER BY ib.expiry_date ASC
    `;
    const result = await this.executeQuery(text, [daysThreshold], client);
    return result.rows;
  }
}

export const inventoryRepository = new InventoryRepository();
export default inventoryRepository;
