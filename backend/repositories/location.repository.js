// 1. Location Repository
import BaseRepository from './base.repository.js';

class LocationRepository extends BaseRepository {
  constructor() {
    super('locations', 'id');
  }

  async findByName(name, client = null) {
    const text = `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER($1) LIMIT 1`;
    const result = await this.executeQuery(text, [name], client);
    return result.rows[0] || null;
  }
}

export const locationRepository = new LocationRepository();
export default locationRepository;
