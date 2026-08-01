import connectionPool from '../../database/connectionPool.js';
import logger from '../logger.js';

class AuditLogger {
  /**
   * Log a security or inventory action in the activity_logs table.
   * Runs asynchronously and catches database errors internally to prevent blocking request cycles.
   * 
   * @param {string|null} userId - The target user ID related to this action
   * @param {string} action - The action key (from AUDIT_ACTIONS)
   * @param {string|Object} details - Detail message or JSON object of changes
   * @param {string|null} operatorId - The user performing the operation (created_by)
   */
  async log(userId, action, details, operatorId = null) {
    const detailString = typeof details === 'object' ? JSON.stringify(details) : String(details);
    const actorId = operatorId || userId;

    const queryText = `
      INSERT INTO activity_logs (user_id, action, details, created_by)
      VALUES ($1, $2, $3, $4)
    `;
    const params = [userId, action, detailString, actorId];

    try {
      // Run as independent promise
      await connectionPool.query(queryText, params);
      
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`[Audit Logged] Action: ${action} | Actor: ${actorId}`);
      }
    } catch (err) {
      // Log to files but do not fail the request
      logger.error(`Failed to write database audit log [Action: ${action}]`, {
        message: err.message,
        params
      });
    }
  }
}

const auditLogger = new AuditLogger();

export default auditLogger;
