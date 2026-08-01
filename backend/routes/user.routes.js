import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  listUsers, 
  updateUserStatus, 
  deleteUser 
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validateUpdateProfile } from '../middleware/validation.middleware.js';

const router = Router();

// Apply global authentication block to all user paths
router.use(authenticate);

// GET /api/users/profile
router.get('/profile', getProfile);

// PUT /api/users/profile
router.put('/profile', validateUpdateProfile, updateProfile);

// Administrative Routes - Restricted to Administrator
// GET /api/users
router.get('/', authorize('Administrator'), listUsers);

// PUT /api/users/:id/status
router.put('/:id/status', authorize('Administrator'), updateUserStatus);

// DELETE /api/users/:id
router.delete('/:id', authorize('Administrator'), deleteUser);

export default router;
