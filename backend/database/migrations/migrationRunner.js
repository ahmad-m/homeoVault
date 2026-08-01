import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectionPool from '../connectionPool.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = __dirname;

/**
 * Initializes the migration history table.
 * @param {pg.PoolClient} client - Database client
 */
const initHistoryTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
};

/**
 * Runs all pending migrations (UP).
 */
const migrateUp = async () => {
  logger.info('Database Migration System Started (UP)');
  const client = await connectionPool.getClient();

  try {
    await initHistoryTable(client);

    // Fetch applied migrations
    const { rows } = await client.query('SELECT name FROM migration_history');
    const appliedMigrations = new Set(rows.map(r => r.name));

    // Read migration directory
    const files = fs.readdirSync(MIGRATIONS_DIR);
    const upMigrations = files
      .filter(f => f.endsWith('.up.sql'))
      .sort(); // Run alphabetically

    let runCount = 0;

    for (const file of upMigrations) {
      if (!appliedMigrations.has(file)) {
        logger.info(`Migration Started: Applying [${file}]`);
        const filePath = path.join(MIGRATIONS_DIR, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        // Execute migration and log history in a single transaction
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO migration_history (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          logger.info(`Migration Finished: Successfully applied [${file}]`);
          runCount++;
        } catch (err) {
          await client.query('ROLLBACK');
          logger.error(`Migration Failed: Error applying [${file}], rolled back transaction`, {
            error: err.message,
            stack: err.stack
          });
          throw err;
        }
      }
    }

    if (runCount === 0) {
      logger.info('Database is already up to date. No pending migrations.');
    } else {
      logger.info(`Database Migration Finished. Applied ${runCount} migrations.`);
    }

  } catch (err) {
    logger.error('Global Migration System Failure:', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await connectionPool.close();
  }
};

/**
 * Rolls back the last applied migration (DOWN).
 */
const migrateDown = async () => {
  logger.info('Database Rollback System Started (DOWN)');
  const client = await connectionPool.getClient();

  try {
    await initHistoryTable(client);

    // Fetch the last applied migration record
    const { rows } = await client.query('SELECT name FROM migration_history ORDER BY id DESC LIMIT 1');
    
    if (rows.length === 0) {
      logger.info('No migrations found in history. Nothing to rollback.');
      return;
    }

    const lastMigrationFile = rows[0].name;
    const downMigrationFile = lastMigrationFile.replace('.up.sql', '.down.sql');
    const downFilePath = path.join(MIGRATIONS_DIR, downMigrationFile);

    if (!fs.existsSync(downFilePath)) {
      throw new Error(`Rollback file [${downMigrationFile}] not found for applied migration [${lastMigrationFile}]`);
    }

    logger.info(`Rollback Started: Reverting [${lastMigrationFile}] via [${downMigrationFile}]`);
    const sql = fs.readFileSync(downFilePath, 'utf8');

    // Execute rollback and delete history log in a single transaction
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('DELETE FROM migration_history WHERE name = $1', [lastMigrationFile]);
      await client.query('COMMIT');
      logger.info(`Rollback Finished: Successfully reverted [${lastMigrationFile}]`);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Rollback Failed: Error reverting [${lastMigrationFile}], transaction rolled back`, {
        error: err.message
      });
      throw err;
    }

  } catch (err) {
    logger.error('Global Rollback System Failure:', { error: err.message });
    process.exitCode = 1;
  } finally {
    client.release();
    await connectionPool.close();
  }
};

// Check Command Line Arguments
const command = process.argv[2];
if (command === 'rollback') {
  migrateDown();
} else {
  migrateUp();
}
