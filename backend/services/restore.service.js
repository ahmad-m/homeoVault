import connectionPool from '../database/connectionPool.js';
import systemLogService from './systemLog.service.js';
import { AppError } from '../utils/errorFormatter.js';

class RestoreService {
  /**
   * Parses and previews structural metadata of a backup JSON block.
   */
  previewBackup(backupData) {
    if (!backupData || backupData.version !== '1.0.0' || !backupData.tables) {
      throw new AppError('Invalid backup file format. Missing metadata version or tables map.', 400);
    }

    const preview = {
      version: backupData.version,
      timestamp: new Date(backupData.timestamp).toLocaleString(),
      counts: {}
    };

    for (const [table, rows] of Object.entries(backupData.tables)) {
      preview.counts[table] = Array.isArray(rows) ? rows.length : 0;
    }

    return preview;
  }

  /**
   * Executes transactional override of database rows from backup payload.
   */
  async restoreBackup(backupData, userId) {
    this.previewBackup(backupData); // Validate format first

    const client = await connectionPool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Delete rows in reverse dependency order (child tables first)
      const tablesToDelete = [
        'stock_transactions',
        'inventory_batches',
        'inventory',
        'suppliers',
        'locations',
        'medicine_potencies',
        'medicines',
        'potencies',
        'medicine_forms',
        'manufacturers',
        'medicine_categories',
        'application_settings'
      ];

      for (const t of tablesToDelete) {
        await client.query(`TRUNCATE TABLE ${t} CASCADE`);
      }

      // 2. Re-insert rows in dependency order (parent tables first)
      const tablesToInsert = [
        'application_settings',
        'medicine_categories',
        'manufacturers',
        'medicine_forms',
        'potencies',
        'medicines',
        'medicine_potencies',
        'locations',
        'suppliers',
        'inventory',
        'inventory_batches',
        'stock_transactions'
      ];

      for (const t of tablesToInsert) {
        const rows = backupData.tables[t] || [];
        if (rows.length === 0) continue;

        // Gather column keys
        const columns = Object.keys(rows[0]);
        const colsSql = columns.join(', ');

        for (const row of rows) {
          const values = columns.map(c => row[c]);
          const placeHolders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          const insertSql = `
            INSERT INTO ${t} (${colsSql})
            VALUES (${placeHolders})
          `;
          await client.query(insertSql, values);
        }
      }

      await client.query('COMMIT');
      await systemLogService.info('SYSTEM', 'Database restore executed successfully.', { restoredBy: userId });
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      await systemLogService.error('SYSTEM', 'Database restore failed. Rolled back changes.', err.stack);
      throw new AppError(`Database restore failed: ${err.message}`, 500);
    } finally {
      client.release();
    }
  }
}

export default new RestoreService();
export const restoreService = new RestoreService();
