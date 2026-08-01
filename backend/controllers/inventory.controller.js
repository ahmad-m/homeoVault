import inventoryService from '../services/inventory.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/errorFormatter.js';

/**
 * Lists aggregate inventory items with filters.
 * GET /api/inventory
 */
export const listInventory = asyncHandler(async (req, res) => {
  const { filters, queryOptions } = req;
  const { page, limit } = req.queryOptions.pagination;
  const { sort } = req.queryOptions;
  const q = (req.queryOptions.search && req.queryOptions.search.query) || req.query.q || '';
  const category_id = req.queryOptions.filters?.category_id || req.query.category_id || null;
  const location_id = req.queryOptions.filters?.location_id || req.query.location_id || null;
  const status = req.query.status || ''; // low_stock | out_of_stock

  const result = await inventoryService.listInventory({
    query: q,
    category_id,
    location_id,
    status,
    limit,
    offset: req.queryOptions.pagination.offset
  });

  return sendSuccess(res, result, 'Inventory aggregates list retrieved.');
});

/**
 * Fetches single inventory item details and its active batch lots.
 * GET /api/inventory/:id
 */
export const getInventoryById = asyncHandler(async (req, res) => {
  const inventoryId = req.params.id;
  const inventory = await inventoryService.listInventory({ limit: 1, offset: 0 }); // Fetch by ID lookup
  
  // We can query database directly or fetch using a simple query in repository
  const client = await inventoryService.listInventory({ limit: 1000, offset: 0 });
  const item = client.records.find(r => r.id === inventoryId);
  if (!item) {
    throw new AppError('Inventory record not found.', 404);
  }

  const batches = await inventoryService.getBatches(inventoryId);
  
  return sendSuccess(res, {
    ...item,
    batches
  }, 'Inventory details and batch lots retrieved.');
});

/**
 * Triggers Stock-In transaction.
 * POST /api/inventory/stock-in
 */
export const stockIn = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await inventoryService.stockIn(req.body, userId);
  return sendSuccess(res, result, 'Stock input recorded successfully.');
});

/**
 * Triggers Stock-Out transaction.
 * POST /api/inventory/stock-out
 */
export const stockOut = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await inventoryService.stockOut(req.body, userId);
  return sendSuccess(res, result, 'Stock output recorded successfully.');
});

/**
 * Triggers stock quantity adjustment.
 * POST /api/inventory/adjust
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await inventoryService.adjustStock(req.body, userId);
  return sendSuccess(res, result, 'Stock levels adjusted successfully.');
});

/**
 * Transfers medicine default storage location.
 * POST /api/inventory/transfer
 */
export const transferLocation = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await inventoryService.transferLocation(req.body, userId);
  return sendSuccess(res, result, 'Location transfer completed.');
});

/**
 * Lists history of transactions.
 * GET /api/inventory/history
 */
export const getTransactionHistory = asyncHandler(async (req, res) => {
  const medicineId = req.query.medicine_id || null;
  const type = req.query.transaction_type || null;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const result = await inventoryService.getHistory({
    medicine_id: medicineId,
    type,
    limit,
    offset
  });

  return sendSuccess(res, result, 'Transaction log history retrieved.');
});

/**
 * Lists low stock alerts.
 * GET /api/inventory/low-stock
 */
export const getLowStock = asyncHandler(async (req, res) => {
  const list = await inventoryService.getLowStock();
  return sendSuccess(res, list, 'Low stock warnings list retrieved.');
});

/**
 * Lists expiring batches.
 * GET /api/inventory/expiry
 */
export const getExpiringBatches = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const list = await inventoryService.getExpiringBatches(days);
  return sendSuccess(res, list, 'Expiring stock lots list retrieved.');
});
