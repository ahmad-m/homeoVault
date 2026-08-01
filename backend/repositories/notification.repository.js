import BaseRepository from './base.repository.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications', 'id');
  }

  /**
   * Retrieves notification preferences for a user.
   */
  async getPreferences(userId, client = null) {
    const text = `
      SELECT * FROM notification_preferences
      WHERE user_id = $1
    `;
    const result = await this.executeQuery(text, [userId], client);
    if (result.rows.length === 0) {
      // Return default preference object if not found
      return {
        user_id: userId,
        enable_all: true,
        low_stock: true,
        expiry: true,
        dashboard: true,
        email: false,
        push: false
      };
    }
    return result.rows[0];
  }

  /**
   * Upserts notification preferences for a user.
   */
  async updatePreferences(userId, prefs = {}, client = null) {
    const text = `
      INSERT INTO notification_preferences 
        (user_id, enable_all, low_stock, expiry, dashboard, email, push, updated_at)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        enable_all = EXCLUDED.enable_all,
        low_stock = EXCLUDED.low_stock,
        expiry = EXCLUDED.expiry,
        dashboard = EXCLUDED.dashboard,
        email = EXCLUDED.email,
        push = EXCLUDED.push,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      userId,
      prefs.enable_all !== false,
      prefs.low_stock !== false,
      prefs.expiry !== false,
      prefs.dashboard !== false,
      prefs.email === true,
      prefs.push === true
    ];
    const result = await this.executeQuery(text, values, client);
    return result.rows[0];
  }

  /**
   * Fetches paginated list of notifications for a user.
   */
  async getNotifications(userId, { type, isRead, limit = 50, offset = 0 } = {}, client = null) {
    const params = [userId];
    let paramIdx = 2;
    const whereClauses = ['user_id = $1'];

    if (type) {
      whereClauses.push(`type = $${paramIdx++}`);
      params.push(type);
    }
    if (isRead !== undefined) {
      whereClauses.push(`is_read = $${paramIdx++}`);
      params.push(isRead === 'true' || isRead === true);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const dataSql = `
      SELECT * FROM notifications
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    const countSql = `
      SELECT COUNT(*) FROM notifications ${whereSql}
    `;

    const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
    const dataRes = await this.executeQuery(dataSql, queryParams, client);
    const countRes = await this.executeQuery(countSql, params, client);

    return {
      records: dataRes.rows,
      totalRecords: parseInt(countRes.rows[0].count, 10)
    };
  }

  /**
   * Fetches all unread notifications for a user.
   */
  async getUnreadNotifications(userId, limit = 50, client = null) {
    const text = `
      SELECT * FROM notifications
      WHERE user_id = $1 AND is_read = false
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.executeQuery(text, [userId, limit], client);
    return result.rows;
  }

  /**
   * Gets unread notifications count for a user.
   */
  async getUnreadCount(userId, client = null) {
    const text = `
      SELECT COUNT(*) FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await this.executeQuery(text, [userId], client);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(id, userId, client = null) {
    const text = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await this.executeQuery(text, [id, userId], client);
    return result.rows[0];
  }

  /**
   * Marks all notifications as read for a user.
   */
  async markAllAsRead(userId, client = null) {
    const text = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      RETURNING COUNT(*)
    `;
    const result = await this.executeQuery(text, [userId], client);
    return result.rowCount;
  }

  /**
   * Deletes a specific notification.
   */
  async deleteNotification(id, userId, client = null) {
    const text = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await this.executeQuery(text, [id, userId], client);
    return result.rows[0];
  }

  /**
   * Inserts a new system notification.
   */
  async createNotification(userId, title, message, type, client = null) {
    const text = `
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(text, [userId, title, message, type], client);
    return result.rows[0];
  }

  /**
   * Deletes read notifications older than N days.
   */
  async archiveOldNotifications(days = 30, client = null) {
    const text = `
      DELETE FROM notifications
      WHERE is_read = true AND created_at < CURRENT_DATE - (CAST($1 AS INTEGER) * INTERVAL '1 day')
    `;
    const result = await this.executeQuery(text, [days], client);
    return result.rowCount;
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
