import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  getJobsStatus,
  runJobManual
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply global authentication block to all notification endpoints
router.use(authenticate);

// 1. Notification center CRUD
router.get('/notifications', getNotifications);
router.get('/notifications/unread', getUnreadCount);
router.put('/notifications/read-all', markAllRead);
router.put('/notifications/:id/read', markAsRead);
router.delete('/notifications/:id', deleteNotification);

// 2. Preferences
router.get('/notifications/preferences', getPreferences);
router.put('/notifications/preferences', updatePreferences);

// 3. Scheduler Background Jobs
router.get('/jobs/status', getJobsStatus);
router.post('/jobs/run', runJobManual);

export default router;
