import { body, validationResult } from 'express-validator';

/**
 * Standard utility to inspect validation results and return standard JSON error response if checks fail.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Password Complexity Regex checks
const passwordValidator = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number')
  .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character');

/**
 * Register validation constraints
 */
export const validateRegister = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  passwordValidator,
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name cannot exceed 100 characters'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name cannot exceed 100 characters'),
  body('mobile')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid mobile number (10 to 15 digits)'),
  handleValidationErrors
];

/**
 * Login validation constraints
 */
export const validateLogin = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

/**
 * Change Password validation constraints
 */
export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain at least one special character'),
  handleValidationErrors
];

/**
 * Forgot Password validation constraints
 */
export const validateForgotPassword = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * Reset Password validation constraints
 */
export const validateResetPassword = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain at least one special character'),
  handleValidationErrors
];

/**
 * Profile Update validation constraints
 */
export const validateUpdateProfile = [
  body('first_name')
    .optional()
    .trim()
    .notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 100 }).withMessage('First name cannot exceed 100 characters'),
  body('last_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 100 }).withMessage('Last name cannot exceed 100 characters'),
  body('mobile')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^\+?[0-9]{10,15}$/).withMessage('Please provide a valid mobile number (10 to 15 digits)'),
  body('profile_image')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL().withMessage('Profile image must be a valid URL link'),
  handleValidationErrors
];
