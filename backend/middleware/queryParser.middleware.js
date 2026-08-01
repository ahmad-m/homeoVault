import { PAGINATION } from '../utils/core/constants.js';

/**
 * Express Middleware to parse standard query filters, searches, sort orders, and pagination settings.
 * Attaches parsed properties to req.queryOptions for downstream database repository methods.
 * 
 * Example URL query structure:
 * /api/users?page=2&limit=15&sort=-email&filter[is_active]=true&search=admin&searchFields=email,first_name&searchMode=startsWith
 */
export const queryParser = (req, res, next) => {
  const queryOptions = {};

  // 1. Pagination Parsing
  const page = Math.max(1, parseInt(req.query.page, 10) || PAGINATION.DEFAULT_PAGE);
  let limit = parseInt(req.query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  
  // Bound limit to prevent server overload
  limit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
  const offset = (page - 1) * limit;

  queryOptions.pagination = {
    page,
    limit,
    offset
  };

  // 2. Sorting Parsing
  queryOptions.sort = req.query.sort ? String(req.query.sort).trim() : null;

  // 3. Search Parsing
  const searchQuery = req.query.search ? String(req.query.search).trim() : null;
  const searchFields = req.query.searchFields ? String(req.query.searchFields).split(',') : [];
  const searchMode = req.query.searchMode || 'contains'; // contains | startsWith | exact

  queryOptions.search = searchQuery ? {
    query: searchQuery,
    fields: searchFields.filter(f => /^[a-zA-Z0-9_]+$/.test(f.trim())),
    mode: ['contains', 'startsWith', 'exact'].includes(searchMode) ? searchMode : 'contains'
  } : null;

  // 4. Exact Filters Parsing (filter[column_name]=val)
  const filters = {};
  if (req.query.filter && typeof req.query.filter === 'object') {
    Object.entries(req.query.filter).forEach(([key, val]) => {
      // Validate key format for safety
      if (/^[a-zA-Z0-9_-]+$/.test(key)) {
        let parsedVal = val;
        // Parse booleans and numbers where applicable
        if (val === 'true') parsedVal = true;
        else if (val === 'false') parsedVal = false;
        else if (val === 'null') parsedVal = null;
        else if (!isNaN(val) && val.trim() !== '') parsedVal = Number(val);
        
        filters[key] = parsedVal;
      }
    });
  }
  queryOptions.filters = filters;

  // Attach options block
  req.queryOptions = queryOptions;
  
  next();
};

export default queryParser;
