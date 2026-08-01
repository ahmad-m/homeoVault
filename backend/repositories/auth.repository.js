import BaseRepository from './base.repository.js';

class AuthRepository extends BaseRepository {
  constructor() {
    super('user_sessions', 'id');
  }

  /**
   * Logs a new session when a user signs in.
   * @param {Object} sessionData - Session properties
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object>} Created session row
   */
  async createSession(sessionData, client = null) {
    return await this.insert(sessionData, client);
  }

  /**
   * Locates a session record matching a specific JWT ID (jti).
   * @param {string} jwtId - Unique token identifier
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Session record or null
   */
  async findSessionByJwtId(jwtId, client = null) {
    const text = `
      SELECT * FROM user_sessions 
      WHERE jwt_id = $1 AND is_active = true 
      LIMIT 1
    `;
    const result = await this.executeQuery(text, [jwtId], client);
    return result.rows[0] || null;
  }

  /**
   * Terminates a specific session (Logout).
   * @param {string} jwtId - Unique token identifier
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async invalidateSession(jwtId, client = null) {
    const text = `
      UPDATE user_sessions 
      SET is_active = false, logout_time = CURRENT_TIMESTAMP 
      WHERE jwt_id = $1 AND is_active = true
    `;
    await this.executeQuery(text, [jwtId], client);
  }

  /**
   * Forces logout across all active terminals for a user.
   * @param {string} userId - User identifier
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async invalidateAllUserSessions(userId, client = null) {
    const text = `
      UPDATE user_sessions 
      SET is_active = false, logout_time = CURRENT_TIMESTAMP 
      WHERE user_id = $1 AND is_active = true
    `;
    await this.executeQuery(text, [userId], client);
  }

  /**
   * Registers a new password reset token.
   * @param {Object} tokenData - Token properties { user_id, token, expires_at }
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object>} Reset token record
   */
  async createResetToken(tokenData, client = null) {
    const keys = Object.keys(tokenData);
    const values = Object.values(tokenData);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    
    const text = `
      INSERT INTO password_reset_tokens (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    const result = await this.executeQuery(text, values, client);
    return result.rows[0];
  }

  /**
   * Finds an active password reset token.
   * @param {string} token - Token hash string
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Token record or null
   */
  async findResetToken(token, client = null) {
    const text = `
      SELECT * FROM password_reset_tokens 
      WHERE token = $1 AND is_used = false AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    const result = await this.executeQuery(text, [token], client);
    return result.rows[0] || null;
  }

  /**
   * Marks a password reset token as consumed.
   * @param {string} token - Token hash string
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async markResetTokenAsUsed(token, client = null) {
    const text = `
      UPDATE password_reset_tokens 
      SET is_used = true 
      WHERE token = $1
    `;
    await this.executeQuery(text, [token], client);
  }
}

export default new AuthRepository();
