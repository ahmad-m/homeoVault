import config from '../config/config.js';

/**
 * PostgreSQL client-specific configuration.
 * Formats data from the global config loader into a structure compatible with pg.Pool.
 */
const databaseConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  max: config.db.pool.max,
  idleTimeoutMillis: config.db.pool.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.pool.connectionTimeoutMillis,
  // Enable SSL connection for production databases with self-signed certificate support
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false
};

export default databaseConfig;
