import BaseRepository from './base.repository.js';

class SettingsRepository extends BaseRepository {
  constructor() {
    super('application_settings', 'id');
  }

  /**
   * Fetches all key-value application settings rows.
   */
  async getAllSettings(client = null) {
    const text = 'SELECT setting_key, setting_value, category FROM application_settings';
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Updates multiple application settings in a single bulk operation.
   */
  async updateSettings(settingsMap = {}, client = null) {
    const updated = [];
    const text = `
      INSERT INTO application_settings (setting_key, setting_value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = NOW()
      RETURNING *
    `;

    for (const [key, val] of Object.entries(settingsMap)) {
      const result = await this.executeQuery(text, [key, String(val)], client);
      updated.push(result.rows[0]);
    }
    return updated;
  }

  /**
   * Fetches the visual overrides (theme, language) of a user.
   */
  async getUserPreferences(userId, client = null) {
    const text = 'SELECT * FROM system_preferences WHERE user_id = $1';
    const result = await this.executeQuery(text, [userId], client);
    if (result.rows.length === 0) {
      return {
        user_id: userId,
        theme: 'dark',
        language: 'en',
        landing_page: '/dashboard'
      };
    }
    return result.rows[0];
  }

  /**
   * Updates the visual overrides of a user.
   */
  async updateUserPreferences(userId, prefs = {}, client = null) {
    const text = `
      INSERT INTO system_preferences (user_id, theme, language, landing_page, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        landing_page = EXCLUDED.landing_page,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      userId,
      prefs.theme || 'dark',
      prefs.language || 'en',
      prefs.landing_page || '/dashboard'
    ];
    const result = await this.executeQuery(text, values, client);
    return result.rows[0];
  }

  /**
   * Logs a backup generation history record.
   */
  async addBackupLog(filename, fileSize, userId, status = 'SUCCESS', errorDetails = null, client = null) {
    const text = `
      INSERT INTO backup_history (filename, file_size, created_by, status, error_details, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(text, [filename, fileSize, userId, status, errorDetails], client);
    return result.rows[0];
  }

  /**
   * Retrieves all logged backups.
   */
  async getBackupHistory(client = null) {
    const text = `
      SELECT bh.*, u.first_name || ' ' || u.last_name as operator_name
      FROM backup_history bh
      LEFT JOIN users u ON bh.created_by = u.id
      ORDER BY bh.created_at DESC
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Retrieves a specific backup log by UUID.
   */
  async getBackupById(id, client = null) {
    const text = 'SELECT * FROM backup_history WHERE id = $1';
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0];
  }
}

export const settingsRepository = new SettingsRepository();
export default settingsRepository;
