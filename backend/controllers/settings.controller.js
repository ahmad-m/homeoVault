import settingsService from '../services/settings.service.js';
import backupService from '../services/backup.service.js';
import restoreService from '../services/restore.service.js';
import settingsRepository from '../repositories/settings.repository.js';
import { sendSuccess } from '../utils/responseFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../utils/errorFormatter.js';

/**
 * GET /api/settings
 */
export const getSystemSettings = asyncHandler(async (req, res) => {
  const result = await settingsService.getSystemSettings();
  return sendSuccess(res, result, 'Application settings retrieved.');
});

/**
 * PUT /api/settings
 */
export const saveSystemSettings = asyncHandler(async (req, res) => {
  const result = await settingsService.saveSystemSettings(req.body, req.user.id);
  return sendSuccess(res, result, 'Application settings saved.');
});

/**
 * GET /api/settings/user
 */
export const getUserPrefs = asyncHandler(async (req, res) => {
  const result = await settingsService.getUserPrefs(req.user.id);
  return sendSuccess(res, result, 'User preference overrides retrieved.');
});

/**
 * PUT /api/settings/user
 */
export const saveUserPrefs = asyncHandler(async (req, res) => {
  const result = await settingsService.saveUserPrefs(req.user.id, req.body);
  return sendSuccess(res, result, 'User preference overrides saved.');
});

/**
 * POST /api/backup/create
 */
export const createBackupFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await backupService.createBackup(userId);
  return sendSuccess(res, result, 'System backup file generated successfully.');
});

/**
 * GET /api/backup/history
 */
export const getBackupHistory = asyncHandler(async (req, res) => {
  const result = await backupService.getHistory();
  return sendSuccess(res, result, 'Backup history logs compiled.');
});

/**
 * GET /api/backup/download/:id
 */
export const downloadBackupFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const log = await settingsRepository.getBackupById(id);

  if (!log) {
    throw new AppError('Backup log entry not found.', 404);
  }

  const filePath = backupService.getBackupFilePath(log.filename);
  return res.download(filePath, log.filename);
});

/**
 * POST /api/backup/restore
 */
export const restoreBackupFile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { backupData } = req.body;

  if (!backupData) {
    throw new AppError('backupData property containing backup JSON content is required in request body.', 400);
  }

  await restoreService.restoreBackup(backupData, userId);
  return sendSuccess(res, null, 'Application database and configurations restored successfully from backup.');
});
