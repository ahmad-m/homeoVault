import BaseRepository from './base.repository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'id');
  }

  /**
   * Retrieves a user by email, joining role information.
   * @param {string} email - Search email
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} User object with role_name or null
   */
  async findByEmail(email, client = null) {
    const text = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const result = await this.executeQuery(text, [email], client);
    return result.rows[0] || null;
  }

  /**
   * Retrieves a user by ID, joining role information.
   * @param {string} id - User ID
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} User object with role_name or null
   */
  async findByIdWithRole(id, client = null) {
    const text = `
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = $1
    `;
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0] || null;
  }

  /**
   * Increments the login attempts count for a user.
   * @param {string} id - User ID
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<number>} Current login attempts count
   */
  async incrementLoginAttempts(id, client = null) {
    const text = `
      UPDATE users 
      SET login_attempts = login_attempts + 1 
      WHERE id = $1 
      RETURNING login_attempts
    `;
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0]?.login_attempts || 0;
  }

  /**
   * Resets login attempts and clears lockout.
   * @param {string} id - User ID
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async resetLoginAttempts(id, client = null) {
    const text = `
      UPDATE users 
      SET login_attempts = 0, locked_until = NULL 
      WHERE id = $1
    `;
    await this.executeQuery(text, [id], client);
  }

  /**
   * Locks the user account until a specified timestamp.
   * @param {string} id - User ID
   * @param {Date} lockedUntil - Unlock timestamp
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async lockAccount(id, lockedUntil, client = null) {
    const text = `
      UPDATE users 
      SET locked_until = $1 
      WHERE id = $2
    `;
    await this.executeQuery(text, [lockedUntil, id], client);
  }

  /**
   * Updates last login timestamp.
   * @param {string} id - User ID
   * @param {pg.PoolClient} [client] - Transactional client
   */
  async updateLastLogin(id, client = null) {
    const text = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = $1
    `;
    await this.executeQuery(text, [id], client);
  }

  /**
   * Performs a soft delete by toggling active status to false.
   * @param {string} id - User ID
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Deleted record
   */
  async softDelete(id, client = null) {
    const text = `
      UPDATE users 
      SET is_active = false 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0] || null;
  }

  /**
   * Retrieves all active/inactive users with their roles.
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Array>} List of users
   */
  async findAllWithRoles(client = null) {
    const text = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.mobile, u.profile_image, 
             u.is_active, u.last_login, u.created_at, u.updated_at, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }
}

export default new UserRepository();
