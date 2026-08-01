import BaseRepository from './base.repository.js';

class SupplierRepository extends BaseRepository {
  constructor() {
    super('suppliers', 'id');
  }

  async findByName(name, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const result = await this.executeQuery(text, [name], client);
    return result.rows[0] || null;
  }
}

export const supplierRepository = new SupplierRepository();
export default supplierRepository;
