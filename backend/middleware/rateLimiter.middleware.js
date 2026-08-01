/**
 * HomeoVault - Lightweight Memory Rate Limiter Middleware
 * Prevents brute-force login and registration attempts without requiring external dependencies.
 */

const ipCache = new Map();

/**
 * Creates a rate limiting middleware.
 * @param {number} windowMs - Time window in milliseconds (e.g. 15 minutes = 900000ms)
 * @param {number} maxAttempts - Max request attempts allowed in the window
 * @param {string} message - Error message on limit exceed
 */
export const rateLimiter = (windowMs = 900000, maxAttempts = 5, message = 'Too many attempts from this IP. Please try again later.') => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipCache.has(ip)) {
      ipCache.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = ipCache.get(ip);

    // If window expired, reset counter
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      ipCache.set(ip, record);
      return next();
    }

    record.count++;
    if (record.count > maxAttempts) {
      return res.status(429).json({
        status: 'fail',
        message,
        resetTime: new Date(record.resetTime).toISOString()
      });
    }

    ipCache.set(ip, record);
    next();
  };
};

export default rateLimiter;
