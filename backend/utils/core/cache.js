import appEvents from './events.js';
import logger from '../logger.js';

class InMemoryCache {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.pruneExpired(), 60000); // Prune every 1 min
  }

  /**
   * Set cached key/value.
   * @param {string} key - Cache key
   * @param {any} value - Cache value
   * @param {number} [ttlSeconds=3600] - Expiry TTL in seconds (default 1 Hour)
   */
  set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get cached value. Returns null if missing or expired.
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.del(key); // Lazy deletion of expired item
      return null;
    }

    return item.value;
  }

  /**
   * Delete a key from cache.
   * @param {string} key - Cache key
   */
  del(key) {
    this.store.delete(key);
  }

  /**
   * Clears the entire cache store and dispatches a system event.
   */
  flush() {
    this.store.clear();
    logger.info('In-Memory Cache store flushed.');
    appEvents.emit('cache:flushed');
  }

  /**
   * Periodically deletes expired keys to prevent memory growth.
   */
  pruneExpired() {
    const now = Date.now();
    let pruneCount = 0;
    
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        pruneCount++;
      }
    }

    if (pruneCount > 0 && process.env.NODE_ENV !== 'production') {
      logger.debug(`Pruned ${pruneCount} expired entries from cache.`);
    }
  }

  /**
   * Destroys the pruning interval (used in tests or server shutdowns).
   */
  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

const cache = new InMemoryCache();

export default cache;
