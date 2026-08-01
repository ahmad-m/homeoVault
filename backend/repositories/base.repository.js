import connectionPool from '../database/connectionPool.js';
import { formatDatabaseError } from '../utils/errorFormatter.js';

/**
 * Reusable Repository Base Class for PostgreSQL operations.
 * Implements CRUD actions with parameterized queries to prevent SQL Injection.
 */
class BaseRepository {
  /**
   * @param {string} tableName - PostgreSQL table name
   * @param {string} primaryKey - Name of primary key column (default 'id')
   */
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  /**
   * Helper to execute queries on the pool or a transactional client.
   * @param {string} text - SQL query template
   * @param {Array} params - Parameter array
   * @param {pg.PoolClient} [client] - Optional client for active transactions
   * @returns {Promise<pg.QueryResult>} Result payload
   */
  async executeQuery(text, params = [], client = null) {
    const db = client || connectionPool;
    try {
      return await db.query(text, params);
    } catch (err) {
      throw formatDatabaseError(err);
    }
  }

  /**
   * Executes multiple queries within an ACID transaction block.
   * @param {Function} callback - Async function executing commands on the client
   * @returns {Promise<any>} Response of callback
   */
  async transaction(callback) {
    const client = await connectionPool.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw formatDatabaseError(err);
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve record by its primary key ID.
   * @param {string|number} id - Record identifier
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Record payload or null
   */
  async findById(id, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0] || null;
  }

  /**
   * Retrieve all records in the table.
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Array>} List of records
   */
  async findAll(client = null) {
    const text = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }

  /**
   * Dynamically build and run an INSERT command.
   * @param {Object} data - Key/value object containing column properties
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object>} Created record
   */
  async insert(data, client = null) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) {
      throw new Error('Insert data payload cannot be empty');
    }

    const columns = keys.join(', ');
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');
    
    const text = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.executeQuery(text, values, client);
    return result.rows[0];
  }

  /**
   * Dynamically build and run an UPDATE command.
   * @param {string|number} id - Record identifier to locate
   * @param {Object} data - Key/value object containing properties to patch
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Updated record or null
   */
  async update(id, data, client = null) {
    const keys = Object.keys(data);
    const values = Object.values(data);

    if (keys.length === 0) {
      return this.findById(id, client);
    }

    const setClauses = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');
    
    const text = `
      UPDATE ${this.tableName}
      SET ${setClauses}
      WHERE ${this.primaryKey} = $${keys.length + 1}
      RETURNING *
    `;

    const result = await this.executeQuery(text, [...values, id], client);
    return result.rows[0] || null;
  }

  /**
   * Deletes a record from the database.
   * @param {string|number} id - Record identifier
   * @param {pg.PoolClient} [client] - Transactional client
   * @returns {Promise<Object|null>} Deleted record details or null
   */
  async delete(id, client = null) {
    const text = `
      DELETE FROM ${this.tableName}
      WHERE ${this.primaryKey} = $1
      RETURNING *
    `;
    const result = await this.executeQuery(text, [id], client);
    return result.rows[0] || null;
  }
}

export default BaseRepository;
