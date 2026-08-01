import notificationService from '../services/notification.service.js';
import schedulerService from '../services/scheduler.service.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/errorFormatter.js';

/**
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const isRead = req.query.isRead;
  const type = req.query.type;
  
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const result = await notificationService.getUserNotifications(userId, { type, isRead, limit, offset });
  return sendSuccess(res, result, 'Notifications retrieved.');
});

/**
 * GET /api/notifications/unread
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await notificationService.getUnreadCount(userId);
  return sendSuccess(res, { count }, 'Unread count compiled.');
});

/**
 * PUT /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const result = await notificationService.markAsRead(id, userId);
  return sendSuccess(res, result, 'Notification marked as read.');
});

/**
 * PUT /api/notifications/read-all
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await notificationService.markAllAsRead(userId);
  return sendSuccess(res, null, 'All notifications marked as read.');
});

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  await notificationService.deleteNotification(id, userId);
  return sendSuccess(res, null, 'Notification removed.');
});

/**
 * GET /api/notifications/preferences
 */
export const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.getPreferences(userId);
  return sendSuccess(res, result, 'Notification preferences retrieved.');
});

/**
 * PUT /api/notifications/preferences
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.updatePreferences(userId, req.body);
  return sendSuccess(res, result, 'Notification preferences updated.');
});

/**
 * GET /api/jobs/status
 */
export const getJobsStatus = asyncHandler(async (req, res) => {
  const result = await schedulerService.getJobStatus();
  return sendSuccess(res, result, 'Background scheduled jobs status retrieved.');
});

/**
 * POST /api/jobs/run
 */
export const runJobManual = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new AppError('Job name is required in request body.', 400);
  }
  await schedulerService.runJobManual(name);
  return sendSuccess(res, null, `Scheduled job [${name}] started in the background.`);
});
