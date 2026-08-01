import BaseRepository from './base.repository.js';

class PotencyRepository extends BaseRepository {
  constructor() {
    super('potencies', 'id');
  }

  async findByName(name, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const result = await this.executeQuery(text, [name], client);
    return result.rows[0] || null;
  }

  // Overrides findAll to sort potencies by display order
  async findAll(client = null) {
    const text = `SELECT * FROM ${this.tableName} ORDER BY display_order ASC`;
    const result = await this.executeQuery(text, [], client);
    return result.rows;
  }
}

export const potencyRepository = new PotencyRepository();
export default potencyRepository;
