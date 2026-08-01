import os from 'os';
import { checkHealth } from '../database/connectionPool.js';
import config from '../config/config.js';

class HealthService {
  /**
   * Retrieves current application and system health stats asynchronously, including database status.
   * @returns {Promise<Object>} System health information.
   */
  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const dbHealth = await checkHealth();
    
    // System is DEGRADED if DB is down, but app process is still responsive
    const overallStatus = dbHealth.status === 'UP' ? 'UP' : 'DEGRADED';
    
    return {
      status: overallStatus,
      environment: config.env,
      version: '1.0.0', // Application version
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // seconds
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      database: dbHealth,
      system: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCores: os.cpus().length,
        loadAverage: os.loadavg()
      },
      process: {
        pid: process.pid,
        memory: {
          rss: Math.round(memoryUsage.rss / (1024 * 1024)) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / (1024 * 1024)) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / (1024 * 1024)) + ' MB',
          external: Math.round(memoryUsage.external / (1024 * 1024)) + ' MB'
        }
      }
    };
  }
}

export default new HealthService();
