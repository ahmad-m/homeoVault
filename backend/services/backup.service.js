import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectionPool from '../database/connectionPool.js';
import settingsRepository from '../repositories/settings.repository.js';
import systemLogService from './systemLog.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.join(__dirname, '../../../backups');

class BackupService {
  constructor() {
    // Ensure backups directory exists
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  /**
   * Helper to download all rows of a database table.
   */
  async _getTableData(tableName) {
    try {
      const res = await connectionPool.query(`SELECT * FROM ${tableName}`);
      return res.rows;
    } catch (err) {
      return [];
    }
  }

  /**
   * Generates a complete serialized backup file.
   */
  async createBackup(userId) {
    const timestamp = Date.now();
    const filename = `homeovault_backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    try {
      const tables = [
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

      const backupData = {
        version: '1.0.0',
        timestamp,
        tables: {}
      };

      // Gather rows for each table
      for (const t of tables) {
        backupData.tables[t] = await this._getTableData(t);
      }

      const fileContent = JSON.stringify(backupData, null, 2);
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      
      const stats = fs.statSync(filePath);
      const logRecord = await settingsRepository.addBackupLog(filename, stats.size, userId, 'SUCCESS');
      
      await systemLogService.info('SYSTEM', `Manual database backup created: ${filename} (${stats.size} bytes).`);
      return logRecord;
    } catch (err) {
      await settingsRepository.addBackupLog(filename, 0, userId, 'FAILED', err.message);
      await systemLogService.error('SYSTEM', 'Failed to generate database backup file.', err.stack);
      throw err;
    }
  }

  /**
   * Returns list of logged backups.
   */
  async getHistory() {
    return await settingsRepository.getBackupHistory();
  }

  /**
   * Resolves target absolute path for downloading a backup.
   */
  getBackupFilePath(filename) {
    const resolvedPath = path.join(BACKUPS_DIR, filename);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error('Backup file does not exist on disk.');
    }
    return resolvedPath;
  }
}

export default new BackupService();
export const backupService = new BackupService();
