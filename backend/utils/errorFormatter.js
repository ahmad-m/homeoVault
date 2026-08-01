import logger from './logger.js';

/**
 * Standard Application Error class extending standard Error.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Parses and formats PostgreSQL errors into structured AppError instances.
 * @param {Error} err - Raw database driver error
 * @returns {AppError} Formatted application error
 */
export const formatDatabaseError = (err) => {
  // If already an AppError, return directly
  if (err instanceof AppError) return err;

  // Postgres specific error code mapping
  if (err.code) {
    logger.error(`Formatting Database Error [Code: ${err.code}]:`, {
      message: err.message,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint
    });

    switch (err.code) {
      case '23505': // unique_violation
        {
          const field = err.detail ? (err.detail.match(/\((.*?)\)/) || [])[1] : 'field';
          return new AppError(`Record with this ${field || 'value'} already exists.`, 409);
        }
      case '23503': // foreign_key_violation
        return new AppError(`Reference constraint failed. Parent record not found or child record depends on this item.`, 400);
      case '23502': // not_null_violation
        return new AppError(`Missing required database field: ${err.column}`, 400);
      case '22P02': // invalid_text_representation (e.g. invalid UUID format)
        return new AppError(`Invalid request value format (expected database type format mismatch).`, 400);
      case '08003': // connection_does_not_exist
      case '57P01': // admin_shutdown
        return new AppError(`Database connection was terminated. Please retry.`, 503);
    }
  }

  // Fallback for standard JS / Node database exceptions
  return new AppError(err.message || 'A database error occurred.', 500);
};

export default {
  AppError,
  formatDatabaseError
};
