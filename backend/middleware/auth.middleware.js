import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import userRepository from '../repositories/user.repository.js';
import authRepository from '../repositories/auth.repository.js';
import { AppError } from '../utils/errorFormatter.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Authentication Route Guard.
 * Inspects headers or cookies for valid JSON Web Tokens and verifies the database session.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token from Cookie or Bearer Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new AppError('Access denied. No authentication token provided.', 401));
  }

  try {
    // 2. Verify token signature
    const decoded = jwt.verify(token, config.jwt.secret);

    // 3. Verify session remains active in database
    const session = await authRepository.findSessionByJwtId(decoded.jti);
    if (!session || !session.is_active) {
      return next(new AppError('Your session has expired or was terminated. Please login again.', 401));
    }

    // 4. Verify user exists and is active
    const user = await userRepository.findByIdWithRole(decoded.id);
    if (!user) {
      return next(new AppError('The user associated with this session no longer exists.', 401));
    }

    if (!user.is_active) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // 5. Attach decoded credentials and user metadata to request context
    req.user = user;
    req.sessionJwtId = decoded.jti;
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token. Authorization failed.', 401));
  }
});

export default {
  authenticate
};
