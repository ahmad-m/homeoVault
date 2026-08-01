/**
 * Wraps async Express handlers to catch errors and forward them to the global error handler.
 * @param {Function} fn The asynchronous request handler function.
 * @returns {Function} Express middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
