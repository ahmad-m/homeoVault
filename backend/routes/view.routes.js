import { Router } from 'express';
import { 
  getLandingPage, 
  getDashboardPage, 
  getLoginPage, 
  getRegisterPage, 
  getForgotPasswordPage, 
  getResetPasswordPage, 
  getProfilePage,
  getMedicinesPage,
  getMedicineDetailsPage,
  getMedicineImportPage,
  getInventoryPage,
  getStockInPage,
  getStockOutPage,
  getInventoryHistoryPage,
  getSuppliersPage,
  getLocationsPage,
  getReportsPage,
  getReportViewPage,
  getNotificationsPage,
  getNotificationSettingsPage,
  getSettingsPage,
  getBackupPage,
  getRestorePage,
  getOfflinePage
} from '../controllers/view.controller.js';

const router = Router();

// GET /
router.get('/', getLandingPage);

// GET /dashboard
router.get('/dashboard', getDashboardPage);

// GET /login & /login.html
router.get('/login', getLoginPage);
router.get('/login.html', getLoginPage);

// GET /register & /register.html
router.get('/register', getRegisterPage);
router.get('/register.html', getRegisterPage);

// GET /forgot-password & /forgot-password.html
router.get('/forgot-password', getForgotPasswordPage);
router.get('/forgot-password.html', getForgotPasswordPage);

// GET /reset-password & /reset-password.html
router.get('/reset-password', getResetPasswordPage);
router.get('/reset-password.html', getResetPasswordPage);

// GET /profile & /profile.html
router.get('/profile', getProfilePage);
router.get('/profile.html', getProfilePage);

// GET /medicines & /medicines.html
router.get('/medicines', getMedicinesPage);
router.get('/medicines.html', getMedicinesPage);

// GET /medicine-details & /medicine-details.html
router.get('/medicine-details', getMedicineDetailsPage);
router.get('/medicine-details.html', getMedicineDetailsPage);

// GET /medicine-import & /medicine-import.html
router.get('/medicine-import', getMedicineImportPage);
router.get('/medicine-import.html', getMedicineImportPage);

// GET /inventory & /inventory.html
router.get('/inventory', getInventoryPage);
router.get('/inventory.html', getInventoryPage);

// GET /stock-in & /stock-in.html
router.get('/stock-in', getStockInPage);
router.get('/stock-in.html', getStockInPage);

// GET /stock-out & /stock-out.html
router.get('/stock-out', getStockOutPage);
router.get('/stock-out.html', getStockOutPage);

// GET /inventory-history & /inventory-history.html
router.get('/inventory-history', getInventoryHistoryPage);
router.get('/inventory-history.html', getInventoryHistoryPage);

// GET /suppliers & /suppliers.html
router.get('/suppliers', getSuppliersPage);
router.get('/suppliers.html', getSuppliersPage);

// GET /locations & /locations.html
router.get('/locations', getLocationsPage);
router.get('/locations.html', getLocationsPage);

// GET /reports & /reports.html
router.get('/reports', getReportsPage);
router.get('/reports.html', getReportsPage);

// GET /report-view & /report-view.html
router.get('/report-view', getReportViewPage);
router.get('/report-view.html', getReportViewPage);

// GET /notifications & /notifications.html
router.get('/notifications', getNotificationsPage);
router.get('/notifications.html', getNotificationsPage);

// GET /notification-settings & /notification-settings.html
router.get('/notification-settings', getNotificationSettingsPage);
router.get('/notification-settings.html', getNotificationSettingsPage);

// GET /settings & /settings.html
router.get('/settings', getSettingsPage);
router.get('/settings.html', getSettingsPage);

// GET /backup & /backup.html
router.get('/backup', getBackupPage);
router.get('/backup.html', getBackupPage);

// GET /restore & /restore.html
router.get('/restore', getRestorePage);
router.get('/restore.html', getRestorePage);

// GET /offline & /offline.html
router.get('/offline', getOfflinePage);
router.get('/offline.html', getOfflinePage);

export default router;
