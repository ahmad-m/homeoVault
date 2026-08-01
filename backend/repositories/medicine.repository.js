import BaseRepository from './base.repository.js';

class MedicineRepository extends BaseRepository {
  constructor() {
    super('medicines', 'id');
  }

  /**
   * Check if a medicine exists by name.
   */
  async findByName(name, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const result = await this.executeQuery(text, [name], client);
    return result.rows[0] || null;
  }

  /**
   * Retrieves full details for a medicine including all relations.
   */
  async findByIdWithDetails(id, client = null) {
    // 1. Fetch core medicine details with category and default form names
    const coreText = `
      SELECT m.*, c.name as category_name, f.name as default_form_name
      FROM medicines m
      JOIN medicine_categories c ON m.category_id = c.id
      LEFT JOIN medicine_forms f ON m.default_form_id = f.id
      WHERE m.id = $1
    `;
    const coreResult = await this.executeQuery(coreText, [id], client);
    const medicine = coreResult.rows[0];
    if (!medicine) return null;

    // 2. Fetch associated potencies
    const potText = `
      SELECT mp.id, p.name 
      FROM medicine_potencies mp
      JOIN potencies p ON mp.potency_id = p.id
      WHERE mp.medicine_id = $1 AND mp.is_active = true
      ORDER BY p.display_order ASC
    `;
    const potResult = await this.executeQuery(potText, [id], client);

    // 3. Fetch associated manufacturers
    const mfrText = `
      SELECT m.id, m.name 
      FROM medicine_manufacturers mm
      JOIN manufacturers m ON mm.manufacturer_id = m.id
      WHERE mm.medicine_id = $1 AND mm.is_active = true
      ORDER BY m.name ASC
    `;
    const mfrResult = await this.executeQuery(mfrText, [id], client);

    // 4. Fetch aliases
    const aliasText = `
      SELECT alias_name FROM medicine_aliases 
      WHERE medicine_id = $1 AND is_active = true
    `;
    const aliasResult = await this.executeQuery(aliasText, [id], client);

    // 5. Fetch tags
    const tagText = `
      SELECT tag_name FROM medicine_tags 
      WHERE medicine_id = $1 AND is_active = true
    `;
    const tagResult = await this.executeQuery(tagText, [id], client);

    // Assemble payload
    return {
      ...medicine,
      potencies: potResult.rows,
      manufacturers: mfrResult.rows,
      aliases: aliasResult.rows.map(r => r.alias_name),
      tags: tagResult.rows.map(r => r.tag_name)
    };
  }

  /**
   * Atomically saves many-to-many mappings (potencies, manufacturers, aliases, and tags).
   * Usually executed within a transaction block.
   */
  async saveMedicineRelations(medicineId, { potencies = [], manufacturers = [], aliases = [], tags = [] }, client = null) {
    // 1. Save Potency Links
    if (potencies.length > 0) {
      // Clear existing
      await this.executeQuery('DELETE FROM medicine_potencies WHERE medicine_id = $1', [medicineId], client);
      
      // Insert new links
      for (const potencyId of potencies) {
        await this.executeQuery(
          'INSERT INTO medicine_potencies (medicine_id, potency_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [medicineId, potencyId],
          client
        );
      }
    }

    // 2. Save Manufacturer Links
    if (manufacturers.length > 0) {
      await this.executeQuery('DELETE FROM medicine_manufacturers WHERE medicine_id = $1', [medicineId], client);
      
      for (const mfrId of manufacturers) {
        await this.executeQuery(
          'INSERT INTO medicine_manufacturers (medicine_id, manufacturer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [medicineId, mfrId],
          client
        );
      }
    }

    // 3. Save Aliases
    if (aliases.length > 0) {
      await this.executeQuery('DELETE FROM medicine_aliases WHERE medicine_id = $1', [medicineId], client);
      
      for (const alias of aliases) {
        if (alias && alias.trim()) {
          await this.executeQuery(
            'INSERT INTO medicine_aliases (medicine_id, alias_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, alias.trim()],
            client
          );
        }
      }
    }

    // 4. Save Tags
    if (tags.length > 0) {
      await this.executeQuery('DELETE FROM medicine_tags WHERE medicine_id = $1', [medicineId], client);
      
      for (const tag of tags) {
        if (tag && tag.trim()) {
          await this.executeQuery(
            'INSERT INTO medicine_tags (medicine_id, tag_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [medicineId, tag.trim()],
            client
          );
        }
      }
    }
  }
}

export const medicineRepository = new MedicineRepository();
export default medicineRepository;
