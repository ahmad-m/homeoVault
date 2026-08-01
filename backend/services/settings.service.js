import settingsRepository from '../repositories/settings.repository.js';
import systemLogService from './systemLog.service.js';

class SettingsService {
  /**
   * Fetches application settings as a unified key-value object map.
   */
  async getSystemSettings() {
    const rows = await settingsRepository.getAllSettings();
    const settingsMap = {};
    rows.forEach(r => {
      settingsMap[r.setting_key] = r.setting_value;
    });
    return settingsMap;
  }

  /**
   * Updates application settings.
   */
  async saveSystemSettings(settingsMap = {}, userId) {
    const result = await settingsRepository.updateSettings(settingsMap);
    await systemLogService.info('SYSTEM', 'Application configuration updated.', { updatedKeys: Object.keys(settingsMap) });
    return result;
  }

  /**
   * Fetches the visual preferences of a user.
   */
  async getUserPrefs(userId) {
    return await settingsRepository.getUserPreferences(userId);
  }

  /**
   * Updates the visual preferences of a user.
   */
  async saveUserPrefs(userId, prefs = {}) {
    const result = await settingsRepository.updateUserPreferences(userId, prefs);
    await systemLogService.info('SYSTEM', `User ${userId} preference profile updated.`);
    return result;
  }
}

export default new SettingsService();
