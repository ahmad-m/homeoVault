import connectionPool from '../database/connectionPool.js';
import logger from '../utils/logger.js';
import { AppError } from '../utils/errorFormatter.js';

class SearchService {
  constructor() {
    this.recentSearches = [];
  }

  /**
   * Performs advanced search against the medicine catalog with filters, pagination, and sorting.
   */
  async searchMedicines({
    query = '',
    category_id = null,
    manufacturer_id = null,
    form_id = null,
    potency_id = null,
    page = 1,
    limit = 10,
    sort = 'name'
  }) {
    const params = [];
    let paramIdx = 1;
    const whereClauses = [];

    // Track search query history
    if (query && query.trim()) {
      const qClean = query.trim();
      this.trackSearch(qClean);
      
      const searchParam = `%${qClean}%`;
      const queryIdx = paramIdx++;
      params.push(searchParam);

      // Search across name, latin, short name, tags, aliases, and keywords
      whereClauses.push(`(
        m.name ILIKE $${queryIdx} OR 
        m.latin_name ILIKE $${queryIdx} OR 
        m.common_name ILIKE $${queryIdx} OR
        m.short_name ILIKE $${queryIdx} OR
        m.search_keywords ILIKE $${queryIdx} OR
        m.id IN (SELECT medicine_id FROM medicine_aliases WHERE alias_name ILIKE $${queryIdx}) OR
        m.id IN (SELECT medicine_id FROM medicine_tags WHERE tag_name ILIKE $${queryIdx})
      )`);
    }

    // Filters
    if (category_id) {
      whereClauses.push(`m.category_id = $${paramIdx++}`);
      params.push(category_id);
    }
    if (form_id) {
      whereClauses.push(`m.default_form_id = $${paramIdx++}`);
      params.push(form_id);
    }
    if (potency_id) {
      whereClauses.push(`m.id IN (SELECT medicine_id FROM medicine_potencies WHERE potency_id = $${paramIdx++})`);
      params.push(potency_id);
    }
    if (manufacturer_id) {
      whereClauses.push(`m.id IN (SELECT medicine_id FROM medicine_manufacturers WHERE manufacturer_id = $${paramIdx++})`);
      params.push(manufacturer_id);
    }

    whereClauses.push('m.is_active = true');
    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    // Pagination calculations
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limitNum;
    
    // Sort
    let orderSql = 'ORDER BY m.name ASC';
    if (sort === '-created_at') orderSql = 'ORDER BY m.created_at DESC';
    else if (sort === 'created_at') orderSql = 'ORDER BY m.created_at ASC';
    else if (sort === '-name') orderSql = 'ORDER BY m.name DESC';

    // Count SQL (clone parameters and query text)
    const countSql = `
      SELECT COUNT(DISTINCT m.id) 
      FROM medicines m 
      ${whereSql}
    `;

    // Data SQL
    const dataSql = `
      SELECT m.id, m.name, m.latin_name, m.common_name, m.short_name, m.description,
             c.name as category_name, f.name as default_form_name, m.min_stock, m.created_at
      FROM medicines m
      JOIN medicine_categories c ON m.category_id = c.id
      LEFT JOIN medicine_forms f ON m.default_form_id = f.id
      ${whereSql}
      GROUP BY m.id, c.name, f.name
      ${orderSql}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const queryParams = [...params, limitNum, offset];

    try {
      const dataResult = await connectionPool.query(dataSql, queryParams);
      const countResult = await connectionPool.query(countSql, params);
      const totalRecords = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(totalRecords / limitNum);

      return {
        records: dataResult.rows,
        pagination: {
          page: parseInt(page, 10),
          limit: limitNum,
          totalPages,
          totalRecords
        }
      };
    } catch (err) {
      logger.error('Failed to run search queries on medicines master', err);
      throw new AppError('Search operations failed.', 500);
    }
  }

  /**
   * Fast autocomplete query matching first chars.
   */
  async autocomplete(queryString) {
    if (!queryString || !queryString.trim()) return [];
    
    const text = `
      SELECT id, name, latin_name 
      FROM medicines 
      WHERE (name ILIKE $1 OR short_name ILIKE $1) AND is_active = true 
      ORDER BY name ASC 
      LIMIT 6
    `;
    const result = await connectionPool.query(text, [`${queryString.trim()}%`]);
    return result.rows;
  }

  /**
   * Tracks recently searched terms.
   */
  trackSearch(queryString) {
    if (!queryString) return;
    const term = queryString.trim().toLowerCase();
    
    // Remove if already in list
    this.recentSearches = this.recentSearches.filter(s => s !== term);
    
    // Add to front of list
    this.recentSearches.unshift(term);
    
    // Keep max 5 searches
    if (this.recentSearches.length > 5) this.recentSearches.pop();
  }

  getRecentSearches() {
    return this.recentSearches;
  }

  /**
   * Retrieves popular medicines based on query views in logs.
   */
  async getPopularMedicines() {
    const text = `
      SELECT m.id, m.name, COUNT(a.id) as action_count
      FROM activity_logs a
      JOIN medicines m ON a.user_id = m.id
      WHERE a.action = 'VIEW_MEDICINE'
      GROUP BY m.id, m.name
      ORDER BY action_count DESC
      LIMIT 5
    `;
    try {
      const result = await connectionPool.query(text);
      if (result.rows.length > 0) return result.rows;
      
      // Fallback: If no activity logs exist, return 5 default medicines
      const fallback = await connectionPool.query('SELECT id, name FROM medicines WHERE is_active = true LIMIT 5');
      return fallback.rows;
    } catch (err) {
      logger.error('Failed to fetch popular medicines logs', err);
      return [];
    }
  }
}

export default new SearchService();
