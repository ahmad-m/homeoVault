import dashboardService from '../services/dashboard.service.js';
import analyticsService from '../services/analytics.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /api/dashboard/summary
 */
export const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummaryMetrics();
  return sendSuccess(res, summary, 'Dashboard KPI metrics retrieved.');
});

/**
 * GET /api/dashboard/activity
 */
export const getActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivities();
  return sendSuccess(res, activity, 'Recent activity ledger retrieved.');
});

/**
 * GET /api/dashboard/low-stock
 */
export const getLowStock = asyncHandler(async (req, res) => {
  const list = await dashboardService.getLowStockDetails();
  return sendSuccess(res, list, 'Low stock medicines list retrieved.');
});

/**
 * GET /api/dashboard/expiry
 */
export const getExpiry = asyncHandler(async (req, res) => {
  const details = await dashboardService.getExpiryDetails();
  return sendSuccess(res, details, 'Expiry warning logs retrieved.');
});

/**
 * GET /api/dashboard/charts
 */
export const getCharts = asyncHandler(async (req, res) => {
  const charts = await analyticsService.getChartDatasets();
  return sendSuccess(res, charts, 'Analytics chart datasets formatted.');
});

/**
 * GET /api/dashboard/analytics
 */
export const getAnalytics = asyncHandler(async (req, res) => {
  const summary = await analyticsService.getAnalyticsSummary();
  return sendSuccess(res, summary, 'Overall analytics summaries retrieved.');
});
