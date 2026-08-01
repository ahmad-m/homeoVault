import { AppError } from '../utils/errorFormatter.js';

/**
 * Role Authorization Filter.
 * Restricts access to endpoints based on user roles (e.g. Administrator).
 * Requires the 'authenticate' middleware to have run first to populate req.user.
 * 
 * @param {...string} allowedRoles - Names of permitted roles
 * @returns {Function} Express middleware
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication context missing. Role validation failed.', 500));
    }

    const hasRole = allowedRoles.some(
      role => req.user.role_name.toLowerCase() === role.toLowerCase()
    );

    if (!hasRole) {
      return next(new AppError(`Access denied. Role [${req.user.role_name}] is unauthorized.`, 403));
    }

    next();
  };
};

export default {
  authorize
};
