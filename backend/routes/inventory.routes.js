import { Router } from 'express';
import { 
  listInventory, 
  getInventoryById, 
  stockIn, 
  stockOut, 
  adjustStock, 
  transferLocation, 
  getTransactionHistory, 
  getLowStock, 
  getExpiringBatches 
} from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { queryParser } from '../middleware/queryParser.middleware.js';
import connectionPool from '../database/connectionPool.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

// Apply global authentication block to all inventory endpoints
router.use(authenticate);

// 1. Storage cabinet locations management
router.get('/locations', asyncHandler(async (req, res) => {
  const result = await connectionPool.query('SELECT * FROM locations WHERE is_active = true ORDER BY name ASC');
  return sendSuccess(res, result.rows, 'Cabinet locations retrieved.');
}));

router.post('/locations', asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const result = await connectionPool.query(
    'INSERT INTO locations (name, description) VALUES ($1, $2) RETURNING *',
    [name.trim(), description || '']
  );
  return sendSuccess(res, result.rows[0], 'Storage location created.');
}));

// 2. Suppliers management
router.get('/suppliers', asyncHandler(async (req, res) => {
  const result = await connectionPool.query('SELECT * FROM suppliers WHERE is_active = true ORDER BY name ASC');
  return sendSuccess(res, result.rows, 'Suppliers list retrieved.');
}));

router.post('/suppliers', asyncHandler(async (req, res) => {
  const { name, contact_name, email, phone, address } = req.body;
  const result = await connectionPool.query(
    'INSERT INTO suppliers (name, contact_name, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name.trim(), contact_name || '', email || '', phone || '', address || '']
  );
  return sendSuccess(res, result.rows[0], 'Supplier profile registered.');
}));

// 3. Inventory Stock aggregates endpoints
router.get('/inventory', queryParser, listInventory);

// Alert warnings (must be declared BEFORE :id wildcard to prevent routing collisions)
router.get('/inventory/low-stock', getLowStock);
router.get('/inventory/expiry', getExpiringBatches);
router.get('/inventory/history', getTransactionHistory);

// Single inventory details
router.get('/inventory/:id', getInventoryById);

// Transactions actions
router.post('/inventory/stock-in', stockIn);
router.post('/inventory/stock-out', stockOut);
router.post('/inventory/adjust', adjustStock);
router.post('/inventory/transfer', transferLocation);

export default router;
