// 1. Category Repository
import BaseRepository from './base.repository.js';

class CategoryRepository extends BaseRepository {
  constructor() {
    super('medicine_categories', 'id');
  }

  async findByName(name, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const result = await this.executeQuery(text, [name], client);
    return result.rows[0] || null;
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
