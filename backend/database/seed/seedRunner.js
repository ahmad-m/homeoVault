import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectionPool from '../connectionPool.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEEDS_DIR = __dirname;

/**
 * Runs all seed scripts (UP).
 */
const runSeeds = async () => {
  logger.info('Database Seeding Started (UP)');
  const client = await connectionPool.getClient();

  try {
    const files = fs.readdirSync(SEEDS_DIR);
    const upSeeds = files
      .filter(f => f.endsWith('.up.sql'))
      .sort();

    for (const file of upSeeds) {
      logger.info(`Seeding Started: Executing [${file}]`);
      const filePath = path.join(SEEDS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        logger.info(`Seeding Finished: Successfully executed [${file}]`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Seeding Failed: Error executing [${file}], rolled back transaction`, {
          error: err.message
        });
        throw err;
      }
    }

    logger.info('Database Seeding Completed Successfully.');

  } catch (err) {
    logger.error('Global Seeding Runner Failure:', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await connectionPool.close();
  }
};

/**
 * Reverts all seed scripts (DOWN).
 */
const rollbackSeeds = async () => {
  logger.info('Database Seeding Rollback Started (DOWN)');
  const client = await connectionPool.getClient();

  try {
    const files = fs.readdirSync(SEEDS_DIR);
    // Execute rollback seeds in reverse alphabetical order
    const downSeeds = files
      .filter(f => f.endsWith('.down.sql'))
      .sort()
      .reverse();

    for (const file of downSeeds) {
      logger.info(`Seeding Rollback Started: Executing [${file}]`);
      const filePath = path.join(SEEDS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        logger.info(`Seeding Rollback Finished: Successfully executed [${file}]`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Seeding Rollback Failed: Error executing [${file}], transaction rolled back`, {
          error: err.message
        });
        throw err;
      }
    }

    logger.info('Database Seeding Rollback Completed.');

  } catch (err) {
    logger.error('Global Seeding Rollback Failure:', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await connectionPool.close();
  }
};

// Check CLI arguments
const command = process.argv[2];
if (command === 'rollback') {
  rollbackSeeds();
} else {
  runSeeds();
}
