import { importFromCsv } from '../utils/core/dataExporter.js';
import validationService from './validation.service.js';
import connectionPool from '../database/connectionPool.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorFormatter.js';

class ImportService {
  /**
   * Imports homeopathic medicines from CSV or JSON file contents.
   * Runs in a transaction, rolling back completely on fatal database errors.
   * 
   * @param {string} fileContent - Raw upload string (CSV text or JSON)
   * @param {string} fileType - 'csv' | 'json'
   * @param {string} userId - ID of the importing Administrator
   * @returns {Promise<Object>} Import summary metrics
   */
  async importMedicines(fileContent, fileType, userId) {
    let records = [];

    // 1. Parse File Content
    try {
      if (fileType === 'json') {
        records = JSON.parse(fileContent);
      } else {
        records = importFromCsv(fileContent);
      }
    } catch (err) {
      logger.error('Failed parsing upload file format during import', err);
      throw new AppError('Invalid file format. Ensure JSON is parsed correctly or CSV format is valid.', 400);
    }

    if (!Array.isArray(records)) {
      throw new AppError('Invalid import structure. File must contain a list of records.', 400);
    }

    const summary = {
      totalRecordsProcessed: records.length,
      successCount: 0,
      duplicateCount: 0,
      skippedCount: 0,
      errors: []
    };

    logger.info(`Starting bulk import of ${records.length} medicine records...`);

    const client = await connectionPool.getClient();
    await client.query('BEGIN');

    try {
      for (let idx = 0; idx < records.length; idx++) {
        const rowNumber = idx + 1;
        const row = records[idx];

        // 2. Validate Row Structure
        const validation = validationService.validateMedicineRow(row);
        if (!validation.isValid) {
          summary.skippedCount++;
          summary.errors.push({
            row: rowNumber,
            medicineName: row.name || 'Unknown',
            reasons: validation.errors
          });
          continue;
        }

        // 3. Duplicate Detection Check
        const nameQuery = await client.query(
          'SELECT id FROM medicines WHERE LOWER(name) = LOWER($1) LIMIT 1',
          [row.name.trim()]
        );
        if (nameQuery.rows.length > 0) {
          summary.duplicateCount++;
          continue; // Skip duplicate records
        }

        // 4. Resolve Category ID (dynamic insert if missing)
        const categoryName = row.category.trim();
        let catQuery = await client.query(
          'SELECT id FROM medicine_categories WHERE LOWER(name) = LOWER($1) LIMIT 1',
          [categoryName]
        );
        let categoryId;
        if (catQuery.rows.length > 0) {
          categoryId = catQuery.rows[0].id;
        } else {
          const insertCat = await client.query(
            'INSERT INTO medicine_categories (name) VALUES ($1) RETURNING id',
            [categoryName]
          );
          categoryId = insertCat.rows[0].id;
        }

        // 5. Resolve Form ID (dynamic insert if missing)
        let formId = null;
        if (row.default_form && String(row.default_form).trim()) {
          const formName = String(row.default_form).trim();
          let formQuery = await client.query(
            'SELECT id FROM medicine_forms WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [formName]
          );
          if (formQuery.rows.length > 0) {
            formId = formQuery.rows[0].id;
          } else {
            const insertForm = await client.query(
              'INSERT INTO medicine_forms (name) VALUES ($1) RETURNING id',
              [formName]
            );
            formId = insertForm.rows[0].id;
          }
        }

        // 6. Build search keywords list
        const keywordList = [
          row.name,
          row.latin_name || '',
          row.common_name || '',
          row.short_name || '',
          row.category || '',
          row.tags || '',
          row.aliases || ''
        ].join(' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

        // 7. Insert Core Medicine
        const insertMed = await client.query(`
          INSERT INTO medicines (
            name, latin_name, common_name, short_name, description, 
            category_id, default_form_id, min_stock, storage_instructions, 
            notes, search_keywords, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          row.name.trim(),
          row.latin_name ? row.latin_name.trim() : null,
          row.common_name ? row.common_name.trim() : null,
          row.short_name ? row.short_name.trim() : null,
          row.description ? row.description.trim() : null,
          categoryId,
          formId,
          parseInt(row.min_stock, 10) || 0,
          row.storage_instructions ? row.storage_instructions.trim() : null,
          row.notes ? row.notes.trim() : null,
          keywordList,
          userId
        ]);
        const medicineId = insertMed.rows[0].id;

        // 8. Resolve and Save Potencies
        let potenciesList = [];
        if (row.default_potencies) {
          potenciesList = typeof row.default_potencies === 'string' 
            ? row.default_potencies.split(',').map(p => p.trim()) 
            : row.default_potencies;
        }
        for (const potName of potenciesList) {
          if (!potName) continue;
          let potQuery = await client.query(
            'SELECT id FROM potencies WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [potName]
          );
          let potencyId;
          if (potQuery.rows.length > 0) {
            potencyId = potQuery.rows[0].id;
          } else {
            // Find next display order value
            const maxOrder = await client.query('SELECT COALESCE(MAX(display_order), 0) as max_val FROM potencies');
            const insertPot = await client.query(
              'INSERT INTO potencies (name, display_order) VALUES ($1, $2) RETURNING id',
              [potName, maxOrder.rows[0].max_val + 1]
            );
            potencyId = insertPot.rows[0].id;
          }
          await client.query(
            'INSERT INTO medicine_potencies (medicine_id, potency_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, potencyId]
          );
        }

        // 9. Resolve and Save Manufacturers
        let mfrList = [];
        if (row.manufacturer) {
          mfrList = typeof row.manufacturer === 'string'
            ? row.manufacturer.split(',').map(m => m.trim())
            : row.manufacturer;
        }
        for (const mfrName of mfrList) {
          if (!mfrName) continue;
          let mfrQuery = await client.query(
            'SELECT id FROM manufacturers WHERE LOWER(name) = LOWER($1) LIMIT 1',
            [mfrName]
          );
          let manufacturerId;
          if (mfrQuery.rows.length > 0) {
            manufacturerId = mfrQuery.rows[0].id;
          } else {
            const insertMfr = await client.query(
              'INSERT INTO manufacturers (name) VALUES ($1) RETURNING id',
              [mfrName]
            );
            manufacturerId = insertMfr.rows[0].id;
          }
          await client.query(
            'INSERT INTO medicine_manufacturers (medicine_id, manufacturer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, manufacturerId]
          );
        }

        // 10. Save Aliases
        let aliasList = [];
        if (row.aliases) {
          aliasList = typeof row.aliases === 'string'
            ? row.aliases.split(',').map(a => a.trim())
            : row.aliases;
        }
        for (const alias of aliasList) {
          if (!alias) continue;
          await client.query(
            'INSERT INTO medicine_aliases (medicine_id, alias_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, alias]
          );
        }

        // 11. Save Tags
        let tagList = [];
        if (row.tags) {
          tagList = typeof row.tags === 'string'
            ? row.tags.split(',').map(t => t.trim())
            : row.tags;
        }
        for (const tag of tagList) {
          if (!tag) continue;
          await client.query(
            'INSERT INTO medicine_tags (medicine_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, tag]
          );
        }

        summary.successCount++;
      }

      // If errors array is populated, or database issues arose, we fail/rollback the entire import operation
      if (summary.errors.length > 0) {
        logger.warn('Validation failures detected during import. Rolling back transaction.');
        await client.query('ROLLBACK');
        return {
          success: false,
          summary
        };
      }

      await client.query('COMMIT');
      logger.info(`Import finished successfully. Registered ${summary.successCount} remedies.`);
      return {
        success: true,
        summary
      };

    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Fatal database error encountered during import. Transaction rolled back.', err);
      throw new AppError('Fatal database error during import. All entries rolled back.', 500);
    } finally {
      client.release();
    }
  }
}

export default new ImportService();
