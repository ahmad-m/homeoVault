import jobService from './job.service.js';
import connectionPool from '../database/connectionPool.js';
import systemLogService from './systemLog.service.js';

class SchedulerService {
  constructor() {
    this.intervalId = null;
  }

  /**
   * Starts background scheduler hourly interval loops.
   */
  start() {
    if (this.intervalId) return;

    systemLogService.info('SCHEDULER', 'Background Job Scheduler Started (Interval: Hourly)');

    // Trigger immediate checks on boot so the user gets notifications right away
    this._runHourlySequence();

    // 1 Hour in milliseconds = 3600000
    this.intervalId = setInterval(() => {
      this._runHourlySequence();
    }, 3600000);
  }

  /**
   * Stops loops (for clean hot reloads or server exit).
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      systemLogService.info('SCHEDULER', 'Background Job Scheduler Stopped.');
    }
  }

  /**
   * Sequence of all tasks run every hour.
   */
  async _runHourlySequence() {
    try {
      await jobService.checkLowStock();
      await jobService.checkExpiry();
      await jobService.cleanOldSessions();
      await jobService.cleanTemporaryFiles();
      await jobService.updateDashboardStatistics();
    } catch (err) {
      await systemLogService.error('SCHEDULER', 'Failed executing background hourly sequences.', err.stack);
    }
  }

  /**
   * Fetches status of all scheduled background jobs.
   */
  async getJobStatus() {
    const text = 'SELECT * FROM scheduled_jobs ORDER BY name ASC';
    const result = await connectionPool.query(text);
    return result.rows;
  }

  /**
   * Runs a job immediately on-demand in the background.
   */
  async runJobManual(name) {
    // Run asynchronously to return immediately to the client
    let jobPromise = null;
    
    switch (name) {
      case 'Check Low Stock':
        jobPromise = jobService.checkLowStock();
        break;
      case 'Check Expiry':
        jobPromise = jobService.checkExpiry();
        break;
      case 'Clean Old Sessions':
        jobPromise = jobService.cleanOldSessions();
        break;
      case 'Clean Temporary Files':
        jobPromise = jobService.cleanTemporaryFiles();
        break;
      case 'Update Dashboard Statistics':
        jobPromise = jobService.updateDashboardStatistics();
        break;
      case 'Generate Daily Summary':
        jobPromise = jobService.generateDailySummary();
        break;
      default:
        throw new Error(`Job name [${name}] is not recognized.`);
    }

    // Capture completion status and write audit records
    jobPromise.catch(async err => {
      await systemLogService.error('SCHEDULER', `Manual job [${name}] execution crashed.`, err.stack);
    });

    return true;
  }
}

export default new SchedulerService();
export const schedulerService = new SchedulerService();
