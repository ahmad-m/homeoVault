import { checkHealth, close } from './connectionPool.js';
import logger from '../utils/logger.js';

/**
 * Validates the database connection.
 * Used at startup to verify that the database is reachable.
 */
const validateConnection = async () => {
  logger.info('Validating database connection...');
  const health = await checkHealth();
  
  if (health.status === 'UP') {
    logger.info(`Database validation succeeded. Latency: ${health.latency}`);
    await close();
    process.exit(0);
  } else {
    logger.error('Database validation failed. Exiting startup check.', {
      error: health.error
    });
    await close();
    process.exit(1);
  }
};

// Execute if run directly from the command line
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('database.js') || 
  process.argv[1].endsWith('database')
);

if (isDirectRun) {
  validateConnection();
}

export default validateConnection;
