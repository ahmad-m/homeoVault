/**
 * HomeoVault - API Response Formatter
 * Standardizes successful and failed JSON responses across controllers.
 */

/**
 * Sends a structured success JSON response.
 * @param {Object} res - Express response object
 * @param {any} data - Payload data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Sends a structured error JSON response.
 * @param {Object} res - Express response object
 * @param {string} message - Error description message
 * @param {any} errorDetails - Additional error stack or attributes
 * @param {number} statusCode - HTTP status code (default 500)
 */
export const sendError = (res, message = 'An error occurred', errorDetails = null, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails
  });
};

export default {
  success: sendSuccess,
  error: sendError
};
