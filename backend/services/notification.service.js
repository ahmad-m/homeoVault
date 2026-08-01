import notificationRepository from '../repositories/notification.repository.js';
import systemLogService from './systemLog.service.js';
import { AppError } from '../utils/errorFormatter.js';

class NotificationService {
  /**
   * Dispatches a notification to a specific user after checking preferences.
   * Handles framework-only email and push warnings.
   */
  async sendNotification(userId, title, message, type) {
    try {
      const prefs = await notificationRepository.getPreferences(userId);

      // Check if global notifications or specific alerts are disabled
      if (!prefs.enable_all) return null;
      
      const isLowStockAlert = type.startsWith('LOW_STOCK') || type.startsWith('OUT_OF_STOCK');
      const isExpiryAlert = type.startsWith('EXPIRY') || type.startsWith('EXPIRED');

      if (isLowStockAlert && !prefs.low_stock) return null;
      if (isExpiryAlert && !prefs.expiry) return null;

      // 1. Create Dashboard Notification
      let notification = null;
      if (prefs.dashboard) {
        notification = await notificationRepository.createNotification(userId, title, message, type);
      }

      // 2. Email Delivery [Framework Only]
      if (prefs.email) {
        await this.sendEmail(userId, title, message);
      }

      // 3. Push Notifications [Framework Only]
      if (prefs.push) {
        await this.sendPush(userId, title, message);
      }

      return notification;
    } catch (err) {
      await systemLogService.error('SYSTEM', `Failed to dispatch notification to user ${userId}`, err.message);
      return null;
    }
  }

  /**
   * Fetches paginated list of notifications.
   */
  async getUserNotifications(userId, queryOptions) {
    return await notificationRepository.getNotifications(userId, queryOptions);
  }

  /**
   * Fetches unread count.
   */
  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(id, userId) {
    const res = await notificationRepository.markAsRead(id, userId);
    if (!res) {
      throw new AppError('Notification not found or access denied.', 404);
    }
    return res;
  }

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Deletes a specific notification.
   */
  async deleteNotification(id, userId) {
    const res = await notificationRepository.deleteNotification(id, userId);
    if (!res) {
      throw new AppError('Notification not found or access denied.', 404);
    }
    return res;
  }

  /**
   * Retrieves preferences.
   */
  async getPreferences(userId) {
    return await notificationRepository.getPreferences(userId);
  }

  /**
   * Updates user preferences.
   */
  async updatePreferences(userId, prefs) {
    return await notificationRepository.updatePreferences(userId, prefs);
  }

  /**
   * Mock Email Sender [Framework Only]
   */
  async sendEmail(userId, title, message) {
    // Log to system audits demonstrating SMTP interface trigger
    await systemLogService.info('NOTIFICATION', `[EMAIL OUTBOX] Mock SMTP send trigger for user: ${userId} | Title: ${title}`);
    return true;
  }

  /**
   * Mock Push Notification Sender [Framework Only]
   */
  async sendPush(userId, title, message) {
    // Log to system audits demonstrating APNS/FCM interface trigger
    await systemLogService.info('NOTIFICATION', `[PUSH OUTBOX] Mock FCM gateway trigger for user: ${userId} | Title: ${title}`);
    return true;
  }
}

export default new NotificationService();
