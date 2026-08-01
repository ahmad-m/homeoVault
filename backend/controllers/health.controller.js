import healthService from '../services/health.service.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Handles GET /api/health requests.
 */
export const getHealth = asyncHandler(async (req, res) => {
  const healthStats = await healthService.getSystemHealth();
  res.status(200).json({
    success: true,
    data: healthStats
  });
});
