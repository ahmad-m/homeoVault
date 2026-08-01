import { Router } from 'express';
import {
  getSystemSettings,
  saveSystemSettings,
  getUserPrefs,
  saveUserPrefs,
  createBackupFile,
  getBackupHistory,
  restoreBackupFile,
  downloadBackupFile
} from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Apply global authentication block to all settings endpoints
router.use(authenticate);

// 1. Centralized settings CRUD
router.get('/settings', getSystemSettings);
router.put('/settings', saveSystemSettings);

// 2. User visual preference overrides
router.get('/settings/user', getUserPrefs);
router.put('/settings/user', saveUserPrefs);

// 3. Backup and Restore operations
router.post('/backup/create', createBackupFile);
router.get('/backup/history', getBackupHistory);
router.post('/backup/restore', restoreBackupFile);
router.get('/backup/download/:id', downloadBackupFile);

export default router;
