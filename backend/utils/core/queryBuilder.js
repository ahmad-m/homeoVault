/**
 * HomeoVault - PostgreSQL Query Builder Helper
 * Translates filtering, sorting, pagination, and search terms into parameterized SQL.
 */

/**
 * Builds standard SELECT and COUNT queries dynamically.
 * @param {Object} options - Builder specifications
 * @param {string} options.tableName - Table to query
 * @param {Array|string} [options.fields] - Selected columns (default '*')
 * @param {Object} [options.filters] - Exact-match filters { column: value }
 * @param {Object} [options.search] - Search parameters { query, fields, mode }
 * @param {string} [options.sort] - Sort string (e.g. '-created_at', 'name')
 * @param {Object} [options.pagination] - Pagination options { limit, offset }
 * @param {string} [options.defaultSort] - Fallback order sorting (default 'created_at DESC')
 * @returns {Object} { queryText, countText, queryParams, countParams }
 */
export const buildSelectQuery = ({
  tableName,
  fields = ['*'],
  filters = {},
  search = null,
  sort = null,
  pagination = {},
  defaultSort = 'created_at DESC'
}) => {
  const queryParams = [];
  const countParams = [];
  let paramIdx = 1;
  const whereClauses = [];

  // 1. Process Exact Filters
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      // Prevent SQL injection in column names
      if (/^[a-zA-Z0-9_.]+$/.test(key)) {
        whereClauses.push(`${key} = $${paramIdx++}`);
        queryParams.push(val);
        countParams.push(val);
      }
    }
  });

  // 2. Process Search Queries
  if (search && search.query && search.fields && search.fields.length > 0) {
    const searchVal = String(search.query).trim();
    if (searchVal) {
      let matchPattern = searchVal;
      const mode = search.mode || 'contains';

      if (mode === 'contains') matchPattern = `%${searchVal}%`;
      else if (mode === 'startsWith') matchPattern = `${searchVal}%`;
      else if (mode === 'exact') matchPattern = searchVal;

      const searchClauses = [];
      search.fields.forEach(field => {
        if (/^[a-zA-Z0-9_.]+$/.test(field)) {
          searchClauses.push(`${field} ILIKE $${paramIdx++}`);
          queryParams.push(matchPattern);
          countParams.push(matchPattern);
        }
      });

      if (searchClauses.length > 0) {
        whereClauses.push(`(${searchClauses.join(' OR ')})`);
      }
    }
  }

  // Combine WHERE clauses
  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // 3. Process Sort Order
  let orderSql = `ORDER BY ${defaultSort}`;
  if (sort) {
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.substring(1) : sort;
    if (/^[a-zA-Z0-9_.]+$/.test(field)) {
      orderSql = `ORDER BY ${field} ${isDesc ? 'DESC' : 'ASC'}`;
    }
  }

  // 4. Process Pagination limits
  let limitSql = '';
  if (pagination.limit) {
    limitSql = `LIMIT $${paramIdx++}`;
    queryParams.push(parseInt(pagination.limit, 10));
  }

  let offsetSql = '';
  if (pagination.offset !== undefined) {
    offsetSql = `OFFSET $${paramIdx++}`;
    queryParams.push(parseInt(pagination.offset, 10));
  }

  // Assemble Queries
  const selectFields = Array.isArray(fields) ? fields.join(', ') : fields;
  
  const queryText = `
    SELECT ${selectFields} 
    FROM ${tableName} 
    ${whereSql} 
    ${orderSql} 
    ${limitSql} 
    ${offsetSql}
  `.trim().replace(/\s+/g, ' ');

  const countText = `
    SELECT COUNT(*) 
    FROM ${tableName} 
    ${whereSql}
  `.trim().replace(/\s+/g, ' ');

  return {
    queryText,
    countText,
    queryParams,
    countParams
  };
};

export default {
  buildSelectQuery
};
