import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  changePassword, 
  forgotPassword, 
  resetPassword 
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimiter } from '../middleware/rateLimiter.middleware.js';
import { 
  validateRegister, 
  validateLogin, 
  validateChangePassword, 
  validateForgotPassword, 
  validateResetPassword 
} from '../middleware/validation.middleware.js';

const router = Router();

// Limit registration attempts (e.g. max 5 attempts per 15 minutes)
const registerLimiter = rateLimiter(900000, 5, 'Too many registration requests. Try again later.');
// Limit login attempts (e.g. max 10 attempts per 15 minutes)
const loginLimiter = rateLimiter(900000, 10, 'Too many login attempts. Try again later.');

// POST /api/auth/register
router.post('/register', registerLimiter, validateRegister, register);

// POST /api/auth/login
router.post('/login', loginLimiter, validateLogin, login);

// POST /api/auth/logout
router.post('/logout', authenticate, logout);

// POST /api/auth/change-password
router.post('/change-password', authenticate, validateChangePassword, changePassword);

// POST /api/auth/forgot-password
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validateResetPassword, resetPassword);

export default router;
