import reportService from '../services/report.service.js';
import exportService from '../services/export.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/errorFormatter.js';

// Helper to gather query filter parameters
const extractFilters = (req) => {
  return {
    category_id: req.query.category_id || null,
    potency_id: req.query.potency_id || null,
    location_id: req.query.location_id || null,
    supplier_id: req.query.supplier_id || null,
    user_id: req.query.user_id || null,
    batch_number: req.query.batch_number || null,
    action: req.query.action || null,
    expiryStatus: req.query.expiryStatus || null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    search: req.query.search || null
  };
};

// Helper to gather pagination parameters
const extractPagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * GET /api/reports/inventory
 */
export const getInventoryReport = asyncHandler(async (req, res) => {
  const filters = extractFilters(req);
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('inventory', filters, pagination);
  return sendSuccess(res, result, 'Inventory report data compiled.');
});

/**
 * GET /api/reports/stock-in
 */
export const getStockInReport = asyncHandler(async (req, res) => {
  const filters = extractFilters(req);
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('stock-in', filters, pagination);
  return sendSuccess(res, result, 'Stock In report data compiled.');
});

/**
 * GET /api/reports/stock-out
 */
export const getStockOutReport = asyncHandler(async (req, res) => {
  const filters = extractFilters(req);
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('stock-out', filters, pagination);
  return sendSuccess(res, result, 'Stock Out report data compiled.');
});

/**
 * GET /api/reports/expiry
 */
export const getExpiryReport = asyncHandler(async (req, res) => {
  const filters = extractFilters(req);
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('expiry', filters, pagination);
  return sendSuccess(res, result, 'Expiry report data compiled.');
});

/**
 * GET /api/reports/low-stock
 */
export const getLowStockReport = asyncHandler(async (req, res) => {
  const pagination = extractPagination(req);
  const statusType = req.query.statusType || 'low'; // low | out
  const reportKey = statusType === 'out' ? 'out-of-stock' : 'low-stock';
  const result = await reportService.generateReport(reportKey, {}, pagination);
  return sendSuccess(res, result, 'Low stock report data compiled.');
});

/**
 * GET /api/reports/valuation
 */
export const getValuationReport = asyncHandler(async (req, res) => {
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('valuation', {}, pagination);
  return sendSuccess(res, result, 'Valuation report data compiled.');
});

/**
 * GET /api/reports/activity
 */
export const getActivityReport = asyncHandler(async (req, res) => {
  const filters = extractFilters(req);
  const pagination = extractPagination(req);
  const result = await reportService.generateReport('activity', filters, pagination);
  return sendSuccess(res, result, 'Activity log report compiled.');
});

/**
 * Handles Exports for PDF, Excel, and CSV formats.
 * POST /api/export/:format
 */
export const exportReportFile = asyncHandler(async (req, res) => {
  const { format } = req.params; // pdf | excel | csv
  const { reportType, title, filters = {}, columns = [] } = req.body;
  const operatorName = req.user ? `${req.user.first_name} ${req.user.last_name}` : 'System';

  if (!reportType || !title || columns.length === 0) {
    throw new AppError('reportType, title, and columns parameters are required in request body.', 400);
  }

  // Fetch complete dataset (ignore pagination by setting a massive limit)
  const dataset = await reportService.generateReport(reportType, filters, { limit: 100000, offset: 0 });
  const records = dataset.records;

  const exportResult = exportService.exportData(format, title, records, columns, operatorName);

  res.setHeader('Content-Type', exportResult.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
  return res.send(exportResult.buffer);
});
