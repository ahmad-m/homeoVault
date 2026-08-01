import connectionPool from '../database/connectionPool.js';
import inventoryRepository from '../repositories/inventory.repository.js';
import stockTransactionRepository from '../repositories/stockTransaction.repository.js';
import locationRepository from '../repositories/location.repository.js';
import auditLogger from '../utils/core/auditLogger.js';
import { AppError } from '../utils/errorFormatter.js';
import logger from '../utils/logger.js';

class InventoryService {
  /**
   * Registers stock input (STOCK_IN) in the database.
   */
  async stockIn(data, userId) {
    const {
      medicine_potency_id,
      batch_number,
      expiry_date = null,
      purchase_price = 0,
      mrp = 0,
      supplier_id = null,
      quantity,
      default_location_id = null,
      remarks = ''
    } = data;

    // Validations
    if (!medicine_potency_id) throw new AppError('medicine_potency_id is required.', 400);
    if (!batch_number || !batch_number.trim()) throw new AppError('batch_number is required.', 400);
    if (expiry_date && new Date(expiry_date) <= new Date()) throw new AppError('If provided, expiry date must be in the future.', 400);
    if (!quantity || parseInt(quantity, 10) <= 0) throw new AppError('Quantity must be greater than zero.', 400);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      // 1. Resolve or create inventory parent row
      let inventory = await inventoryRepository.findByMedicinePotency(medicine_potency_id, client);
      let inventoryId;

      if (!inventory) {
        // Create initial parent row
        const insertInv = await client.query(`
          INSERT INTO inventory (medicine_potency_id, current_quantity, default_location_id)
          VALUES ($1, 0, $2) RETURNING id
        `, [medicine_potency_id, default_location_id]);
        inventoryId = insertInv.rows[0].id;
      } else {
        inventoryId = inventory.id;
        // Optionally update location if provided
        if (default_location_id) {
          await client.query('UPDATE inventory SET default_location_id = $1 WHERE id = $2', [default_location_id, inventoryId]);
        }
      }

      // 2. Prevent duplicate batch number inserts
      const existingBatch = await inventoryRepository.findBatchByNumber(inventoryId, batch_number, client);
      let batchId;

      if (existingBatch) {
        // If batch exists, we add stock to it (updating quantity and available_quantity)
        batchId = existingBatch.id;
        const newTotalQty = existingBatch.quantity + parseInt(quantity, 10);
        const newAvailQty = existingBatch.available_quantity + parseInt(quantity, 10);

        await client.query(`
          UPDATE inventory_batches 
          SET quantity = $1, available_quantity = $2, expiry_date = $3, purchase_price = $4, mrp = $5, supplier_id = $6
          WHERE id = $7
        `, [newTotalQty, newAvailQty, expiry_date, purchase_price, mrp, supplier_id, batchId]);
      } else {
        // Insert new batch lot
        const insertBatch = await client.query(`
          INSERT INTO inventory_batches (
            inventory_id, batch_number, expiry_date, purchase_price, mrp, 
            supplier_id, quantity, available_quantity
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
        `, [
          inventoryId,
          batch_number.trim(),
          expiry_date,
          purchase_price,
          mrp,
          supplier_id,
          parseInt(quantity, 10),
          parseInt(quantity, 10)
        ]);
        batchId = insertBatch.rows[0].id;
      }

      // 3. Update parent inventory balance
      await client.query(`
        UPDATE inventory 
        SET current_quantity = current_quantity + $1, last_updated = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [parseInt(quantity, 10), inventoryId]);

      // 4. Log stock transaction
      const refNumber = `IN-${Date.now().toString().slice(-6)}`;
      await client.query(`
        INSERT INTO stock_transactions (transaction_type, inventory_batch_id, quantity, reference_number, remarks, performed_by)
        VALUES ('STOCK_IN', $1, $2, $3, $4, $5)
      `, [batchId, parseInt(quantity, 10), refNumber, remarks, userId]);

      await client.query('COMMIT');
      
      // Audit log
      auditLogger.log(inventoryId, 'STOCK_IN', `Stocked in ${quantity} units (Batch: ${batch_number})`, userId);

      return { success: true, batchId, reference_number: refNumber };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed stock in transaction', err);
      throw new AppError(err.message || 'Stock In transaction failed.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Deducts stock (STOCK_OUT) from a target batch lot.
   */
  async stockOut(data, userId) {
    const { inventory_batch_id, quantity, remarks = '' } = data;

    if (!inventory_batch_id) throw new AppError('inventory_batch_id is required.', 400);
    if (!quantity || parseInt(quantity, 10) <= 0) throw new AppError('Deduction quantity must be greater than zero.', 400);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      // 1. Fetch batch detail and lock row
      const batchRes = await client.query('SELECT * FROM inventory_batches WHERE id = $1 FOR UPDATE', [inventory_batch_id]);
      const batch = batchRes.rows[0];
      if (!batch) throw new AppError('Batch lot not found.', 404);

      if (batch.available_quantity < parseInt(quantity, 10)) {
        throw new AppError(`Insufficient stock in batch. Available: ${batch.available_quantity}, Requested: ${quantity}`, 400);
      }

      // 2. Subtract from batch
      const newAvailQty = batch.available_quantity - parseInt(quantity, 10);
      await client.query('UPDATE inventory_batches SET available_quantity = $1 WHERE id = $2', [newAvailQty, inventory_batch_id]);

      // 3. Subtract from aggregate inventory balance
      await client.query(`
        UPDATE inventory 
        SET current_quantity = current_quantity - $1, last_updated = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [parseInt(quantity, 10), batch.inventory_id]);

      // 4. Log transaction
      const refNumber = `OUT-${Date.now().toString().slice(-6)}`;
      await client.query(`
        INSERT INTO stock_transactions (transaction_type, inventory_batch_id, quantity, reference_number, remarks, performed_by)
        VALUES ('STOCK_OUT', $1, $2, $3, $4, $5)
      `, [inventory_batch_id, -parseInt(quantity, 10), refNumber, remarks, userId]);

      await client.query('COMMIT');
      
      auditLogger.log(batch.inventory_id, 'STOCK_OUT', `Stocked out ${quantity} units (Batch: ${batch.batch_number})`, userId);

      return { success: true, reference_number: refNumber };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed stock out transaction', err);
      throw new AppError(err.message || 'Stock Out transaction failed.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Adjusts stock quantity levels on a specific batch.
   */
  async adjustStock(data, userId) {
    const { inventory_batch_id, new_quantity, remarks = '' } = data;

    if (!inventory_batch_id) throw new AppError('inventory_batch_id is required.', 400);
    if (new_quantity === undefined || parseInt(new_quantity, 10) < 0) {
      throw new AppError('New quantity must be a non-negative integer.', 400);
    }

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      const batchRes = await client.query('SELECT * FROM inventory_batches WHERE id = $1 FOR UPDATE', [inventory_batch_id]);
      const batch = batchRes.rows[0];
      if (!batch) throw new AppError('Batch lot not found.', 404);

      const diff = parseInt(new_quantity, 10) - batch.available_quantity;
      if (diff === 0) {
        await client.query('COMMIT');
        return { success: true, message: 'No adjustment needed (quantities match).' };
      }

      // Update batch available qty
      await client.query('UPDATE inventory_batches SET available_quantity = $1 WHERE id = $2', [parseInt(new_quantity, 10), inventory_batch_id]);

      // Update parent inventory
      await client.query(`
        UPDATE inventory 
        SET current_quantity = current_quantity + $1, last_updated = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [diff, batch.inventory_id]);

      // Log transaction
      const refNumber = `ADJ-${Date.now().toString().slice(-6)}`;
      await client.query(`
        INSERT INTO stock_transactions (transaction_type, inventory_batch_id, quantity, reference_number, remarks, performed_by)
        VALUES ('ADJUSTMENT', $1, $2, $3, $4, $5)
      `, [inventory_batch_id, diff, refNumber, remarks, userId]);

      await client.query('COMMIT');
      
      auditLogger.log(batch.inventory_id, 'STOCK_ADJUSTMENT', `Adjusted batch stock by ${diff} units (Batch: ${batch.batch_number})`, userId);

      return { success: true, reference_number: refNumber };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed adjustment transaction', err);
      throw new AppError(err.message || 'Adjustment transaction failed.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Transfers a remedy's default storage location.
   */
  async transferLocation(data, userId) {
    const { inventory_id, new_location_id } = data;

    if (!inventory_id) throw new AppError('inventory_id is required.', 400);
    if (!new_location_id) throw new AppError('new_location_id is required.', 400);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      const invQuery = await client.query('SELECT * FROM inventory WHERE id = $1', [inventory_id]);
      const inv = invQuery.rows[0];
      if (!inv) throw new AppError('Inventory record not found.', 404);

      const locQuery = await client.query('SELECT name FROM locations WHERE id = $1', [new_location_id]);
      const loc = locQuery.rows[0];
      if (!loc) throw new AppError('Target location cabinet not found.', 404);

      await client.query('UPDATE inventory SET default_location_id = $1 WHERE id = $2', [new_location_id, inventory_id]);

      await client.query('COMMIT');

      auditLogger.log(inventory_id, 'LOCATION_TRANSFER', `Transferred inventory to location [${loc.name}]`, userId);
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Failed location transfer transaction', err);
      throw new AppError(err.message || 'Location transfer failed.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Lists inventory aggregates.
   */
  async listInventory(queryOptions) {
    return await inventoryRepository.listInventory(queryOptions);
  }

  /**
   * Lists active batches for an inventory item.
   */
  async getBatches(inventoryId) {
    return await inventoryRepository.findBatchesByInventoryId(inventoryId);
  }

  /**
   * Gets transactional logs history.
   */
  async getHistory(queryOptions) {
    return await stockTransactionRepository.listHistory(queryOptions);
  }

  /**
   * Lists low stock warning alerts.
   */
  async getLowStock() {
    return await inventoryRepository.getLowStock();
  }

  /**
   * Lists batches nearing expiration.
   */
  async getExpiringBatches(days = 30) {
    return await inventoryRepository.getExpiringBatches(days);
  }
}

export default new InventoryService();
