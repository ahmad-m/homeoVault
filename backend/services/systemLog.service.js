import connectionPool from '../database/connectionPool.js';
import winstonLogger from '../utils/logger.js';

class SystemLogService {
  /**
   * Logs a message to both the local file logger and the database audit table.
   * @param {string} level - 'INFO' | 'WARN' | 'ERROR'
   * @param {string} category - 'SCHEDULER' | 'AUTH' | 'INVENTORY' | 'SYSTEM' etc.
   * @param {string} message - Description of event
   * @param {Object|string} [details] - JSON context details or stack traces
   */
  async log(level, category, message, details = null) {
    const detailsStr = details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null;

    // 1. Output to winston logger
    if (level === 'ERROR') {
      winstonLogger.error(`[${category}] ${message}`, { details });
    } else if (level === 'WARN') {
      winstonLogger.warn(`[${category}] ${message}`, { details });
    } else {
      winstonLogger.info(`[${category}] ${message}`);
    }

    // 2. Persist to database system_logs table
    try {
      const text = `
        INSERT INTO system_logs (log_level, category, message, details, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await connectionPool.query(text, [level.toUpperCase(), category.toUpperCase(), message, detailsStr]);
    } catch (dbErr) {
      // Don't throw errors from logging itself to prevent cascading failures
      winstonLogger.error('Failed to write log to PostgreSQL database system_logs table.', { error: dbErr.message });
    }
  }

  async info(category, message, details = null) {
    await this.log('INFO', category, message, details);
  }

  async warn(category, message, details = null) {
    await this.log('WARN', category, message, details);
  }

  async error(category, message, details = null) {
    await this.log('ERROR', category, message, details);
  }
}

export default new SystemLogService();
