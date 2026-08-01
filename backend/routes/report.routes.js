import { Router } from 'express';
import {
  getInventoryReport,
  getStockInReport,
  getStockOutReport,
  getExpiryReport,
  getLowStockReport,
  getValuationReport,
  getActivityReport,
  exportReportFile
} from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply global authentication block to all report endpoints
router.use(authenticate);

// 1. Report queries
router.get('/reports/inventory', getInventoryReport);
router.get('/reports/stock-in', getStockInReport);
router.get('/reports/stock-out', getStockOutReport);
router.get('/reports/expiry', getExpiryReport);
router.get('/reports/low-stock', getLowStockReport);
router.get('/reports/valuation', getValuationReport);
router.get('/reports/activity', getActivityReport);

// 2. Export targets (supports csv, excel, and pdf via format parameter)
router.post('/export/:format', exportReportFile);

export default router;
