import medicineRepository from '../repositories/medicine.repository.js';
import categoryRepository from '../repositories/category.repository.js';
import potencyRepository from '../repositories/potency.repository.js';
import manufacturerRepository from '../repositories/manufacturer.repository.js';
import auditLogger from '../utils/core/auditLogger.js';
import { AppError } from '../utils/errorFormatter.js';
import connectionPool from '../database/connectionPool.js';
import logger from '../utils/logger.js';

class MedicineService {
  /**
   * Fetches single medicine details. Logs a 'VIEW_MEDICINE' action.
   */
  async getMedicineById(id, userId = null) {
    const medicine = await medicineRepository.findByIdWithDetails(id);
    if (!medicine) {
      throw new AppError('Homeopathic medicine record not found.', 404);
    }

    if (userId) {
      auditLogger.log(userId, 'VIEW_MEDICINE', `User [${userId}] viewed medicine [${medicine.name}]`, userId);
    }

    return medicine;
  }

  /**
   * Updates a medicine's core fields and replaces its potency mappings.
   */
  async updateMedicine(id, { name, latin_name, common_name, short_name, description, category_id, potency_ids = [] }, userId) {
    const existing = await medicineRepository.findByIdWithDetails(id);
    if (!existing) throw new AppError('Medicine not found.', 404);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');
    try {
      await client.query(
        `UPDATE medicines SET
           name = COALESCE($1, name),
           latin_name = $2,
           common_name = $3,
           short_name = $4,
           description = $5,
           category_id = COALESCE($6, category_id),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [name || null, latin_name || null, common_name || null, short_name || null, description || null, category_id || null, id]
      );

      // Safely replace potency mappings using is_active flag instead of DELETE to prevent ON DELETE RESTRICT foreign key violations in inventory
      if (potency_ids.length > 0) {
        await client.query('UPDATE medicine_potencies SET is_active = false WHERE medicine_id = $1', [id]);
        for (const potencyId of potency_ids) {
          await client.query(
            `INSERT INTO medicine_potencies (medicine_id, potency_id, is_active) 
             VALUES ($1, $2, true) 
             ON CONFLICT (medicine_id, potency_id) 
             DO UPDATE SET is_active = true`,
            [id, potencyId]
          );
        }
      }

      await client.query('COMMIT');
      auditLogger.log(userId, 'UPDATE_MEDICINE', `Updated medicine [${existing.name}]`, userId);
      return await medicineRepository.findByIdWithDetails(id);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('updateMedicine failed', err);
      throw new AppError(err.message || 'Failed to update medicine.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Soft-deletes a medicine (sets is_active = false).
   */
  async deleteMedicine(id, userId) {
    const existing = await medicineRepository.findByIdWithDetails(id);
    if (!existing) throw new AppError('Medicine not found.', 404);

    await connectionPool.query(
      'UPDATE medicines SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    auditLogger.log(userId, 'DELETE_MEDICINE', `Soft-deleted medicine [${existing.name}]`, userId);
    return { success: true };
  }

  /**
   * Quick-adds a new medicine with selected potencies in a single transaction.
   * Used from the Stock In page when a medicine is not found in the catalog.
   */
  async quickAddMedicine({ name, category_id, potency_ids = [] }, userId) {
    if (!name || !name.trim()) throw new AppError('Medicine name is required.', 400);
    if (!category_id) throw new AppError('Category is required.', 400);
    if (!potency_ids || potency_ids.length === 0) throw new AppError('At least one potency must be selected.', 400);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      // Check for duplicate medicine name
      const existing = await client.query(
        'SELECT id FROM medicines WHERE LOWER(name) = LOWER($1) LIMIT 1',
        [name.trim()]
      );
      if (existing.rows.length > 0) {
        // If already exists, just map the missing potencies and return it
        const medId = existing.rows[0].id;
        for (const potencyId of potency_ids) {
          await client.query(
            'INSERT INTO medicine_potencies (medicine_id, potency_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medId, potencyId]
          );
        }
        await client.query('COMMIT');
        const full = await medicineRepository.findByIdWithDetails(medId);
        return full;
      }

      // Verify category exists
      const catRes = await client.query('SELECT id FROM medicine_categories WHERE id = $1', [category_id]);
      if (!catRes.rows.length) throw new AppError('Selected category not found.', 400);

      // Create the medicine
      const medRes = await client.query(
        `INSERT INTO medicines (name, category_id, min_stock, search_keywords)
         VALUES ($1, $2, 5, $3) RETURNING id`,
        [name.trim(), category_id, name.trim().toLowerCase()]
      );
      const medicineId = medRes.rows[0].id;

      // Link potencies
      for (const potencyId of potency_ids) {
        await client.query(
          'INSERT INTO medicine_potencies (medicine_id, potency_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [medicineId, potencyId]
        );
      }

      await client.query('COMMIT');

      auditLogger.log(userId, 'QUICK_ADD_MEDICINE', `Quick-added medicine [${name}] with ${potency_ids.length} potencies`, userId);

      // Return full details (with potencies resolved to medicine_potency_ids)
      const full = await medicineRepository.findByIdWithDetails(medicineId);
      return full;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('quickAddMedicine failed', err);
      throw new AppError(err.message || 'Failed to create medicine.', 500);
    } finally {
      client.release();
    }
  }

  /**
   * Retrieves all active categories.
   */
  async getCategories() {
    return await categoryRepository.findAll();
  }

  /**
   * Retrieves all active potencies.
   */
  async getPotencies() {
    return await potencyRepository.findAll();
  }

  /**
   * Retrieves all active manufacturers.
   */
  async getManufacturers() {
    return await manufacturerRepository.findAll();
  }

  /**
   * Retrieves all active forms.
   */
  async getForms() {
    const result = await connectionPool.query('SELECT * FROM medicine_forms WHERE is_active = true ORDER BY name ASC');
    return result.rows;
  }
}

export default new MedicineService();
