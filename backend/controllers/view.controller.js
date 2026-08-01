import path from 'path';
import { fileURLToPath } from 'url';
import asyncHandler from '../utils/asyncHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWS_DIR = path.join(__dirname, '../../views');

/**
 * Serves the landing page (index.html).
 */
export const getLandingPage = asyncHandler(async (req, res) => {
  res.render('index', { activePath: req.path });
});

/**
 * Serves the dashboard page (dashboard.html).
 */
export const getDashboardPage = asyncHandler(async (req, res) => {
  res.render('dashboard', { activePath: req.path });
});

/**
 * Serves the login page (login.html).
 */
export const getLoginPage = asyncHandler(async (req, res) => {
  res.render('login', { activePath: req.path });
});

/**
 * Serves the registration page (register.html).
 */
export const getRegisterPage = asyncHandler(async (req, res) => {
  res.render('register', { activePath: req.path });
});

/**
 * Serves the forgot password page (forgot-password.html).
 */
export const getForgotPasswordPage = asyncHandler(async (req, res) => {
  res.render('forgot-password', { activePath: req.path });
});

/**
 * Serves the reset password page (reset-password.html).
 */
export const getResetPasswordPage = asyncHandler(async (req, res) => {
  res.render('reset-password', { activePath: req.path });
});

/**
 * Serves the profile page (profile.html).
 */
export const getProfilePage = asyncHandler(async (req, res) => {
  res.render('profile', { activePath: req.path });
});

/**
 * Serves the medicines catalog page (medicines.html).
 */
export const getMedicinesPage = asyncHandler(async (req, res) => {
  res.render('medicines', { activePath: req.path });
});

/**
 * Serves the medicine details page (medicine-details.html).
 */
export const getMedicineDetailsPage = asyncHandler(async (req, res) => {
  res.render('medicine-details', { activePath: req.path });
});

/**
 * Serves the medicine import page (medicine-import.html).
 */
export const getMedicineImportPage = asyncHandler(async (req, res) => {
  res.render('medicine-import', { activePath: req.path });
});

/**
 * Serves the main inventory page (inventory.html).
 */
export const getInventoryPage = asyncHandler(async (req, res) => {
  res.render('inventory', { activePath: req.path });
});

/**
 * Serves the stock-in page (stock-in.html).
 */
export const getStockInPage = asyncHandler(async (req, res) => {
  res.render('stock-in', { activePath: req.path });
});

/**
 * Serves the stock-out page (stock-out.html).
 */
export const getStockOutPage = asyncHandler(async (req, res) => {
  res.render('stock-out', { activePath: req.path });
});

/**
 * Serves the transaction history page (inventory-history.html).
 */
export const getInventoryHistoryPage = asyncHandler(async (req, res) => {
  res.render('inventory-history', { activePath: req.path });
});

/**
 * Serves the suppliers page (suppliers.html).
 */
export const getSuppliersPage = asyncHandler(async (req, res) => {
  res.render('suppliers', { activePath: req.path });
});

/**
 * Serves the locations page (locations.html).
 */
export const getLocationsPage = asyncHandler(async (req, res) => {
  res.render('locations', { activePath: req.path });
});

/**
 * Serves the reports index page (reports.html).
 */
export const getReportsPage = asyncHandler(async (req, res) => {
  res.render('reports', { activePath: req.path });
});

/**
 * Serves the report details viewer page (report-view.html).
 */
export const getReportViewPage = asyncHandler(async (req, res) => {
  res.render('report-view', { activePath: req.path });
});

/**
 * Serves the notifications index page (notifications.html).
 */
export const getNotificationsPage = asyncHandler(async (req, res) => {
  res.render('notifications', { activePath: req.path });
});

/**
 * Serves the notification settings configuration page (notification-settings.html).
 */
export const getNotificationSettingsPage = asyncHandler(async (req, res) => {
  res.render('notification-settings', { activePath: req.path });
});

/**
 * Serves the settings index page (settings.html).
 */
export const getSettingsPage = asyncHandler(async (req, res) => {
  res.render('settings', { activePath: req.path });
});

/**
 * Serves the database backup page (backup.html).
 */
export const getBackupPage = asyncHandler(async (req, res) => {
  res.render('backup', { activePath: req.path });
});

/**
 * Serves the database restore page (restore.html).
 */
export const getRestorePage = asyncHandler(async (req, res) => {
  res.render('restore', { activePath: req.path });
});

/**
 * Serves the offline fallback page (offline.html).
 */
export const getOfflinePage = asyncHandler(async (req, res) => {
  res.render('offline', { activePath: req.path });
});

/**
 * Serves the 404 page (404.html) with a 404 status.
 */
export const get404Page = asyncHandler(async (req, res) => {
  res.status(404).render('404', { activePath: req.path });
});
