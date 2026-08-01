import { Router } from 'express';
import { 
  getSummary, 
  getActivity, 
  getLowStock, 
  getExpiry, 
  getCharts, 
  getAnalytics 
} from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply global authentication block to all dashboard endpoints
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', getSummary);

// GET /api/dashboard/activity
router.get('/activity', getActivity);

// GET /api/dashboard/low-stock
router.get('/low-stock', getLowStock);

// GET /api/dashboard/expiry
router.get('/expiry', getExpiry);

// GET /api/dashboard/charts
router.get('/charts', getCharts);

// GET /api/dashboard/analytics
router.get('/analytics', getAnalytics);

export default router;
