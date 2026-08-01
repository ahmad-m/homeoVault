import pg from 'pg';
import databaseConfig from './databaseConfig.js';
import logger from '../utils/logger.js';

const { Pool } = pg;

logger.info('Initializing PostgreSQL database connection pool...');

const pool = new Pool(databaseConfig);

// Attach event listener for newly established clients
pool.on('connect', (client) => {
  logger.debug('New client established connection with database');
});

// Capture unexpected errors on idle pool clients
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle database client', {
    message: err.message,
    stack: err.stack
  });
});

/**
 * Standard utility to execute queries against the database pool.
 * @param {string} text - SQL query template
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>} Response payload
 */
export const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    logger.error(`Database query execution failed: ${text}`, {
      message: err.message,
      params
    });
    throw err;
  }
};

/**
 * Acquires a client directly from the pool for multi-query execution or transactions.
 * @returns {Promise<pg.PoolClient>} Pool client
 */
export const getClient = async () => {
  try {
    return await pool.connect();
  } catch (err) {
    logger.error('Failed to acquire database client from connection pool', {
      message: err.message
    });
    throw err;
  }
};

/**
 * Audits the health and latency of the database.
 * @returns {Promise<Object>} Status report
 */
export const checkHealth = async () => {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT NOW()');
    return {
      status: 'UP',
      latency: `${Date.now() - start}ms`,
      dbTimestamp: result.rows[0].now
    };
  } catch (err) {
    logger.error('Database connection health check failed', {
      message: err.message
    });
    return {
      status: 'DOWN',
      error: err.message,
      latency: `${Date.now() - start}ms`
    };
  }
};

/**
 * Closes all active pool connections gracefully.
 */
export const close = async () => {
  logger.info('Shutting down PostgreSQL connection pool...');
  try {
    await pool.end();
    logger.info('PostgreSQL connection pool closed successfully');
  } catch (err) {
    logger.error('Error encountered while shutting down database pool', {
      message: err.message
    });
  }
};

export default {
  query,
  getClient,
  checkHealth,
  close,
  pool
};
