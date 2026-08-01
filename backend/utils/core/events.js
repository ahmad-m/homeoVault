import { EventEmitter } from 'events';
import logger from '../logger.js';

class AppEventEmitter extends EventEmitter {
  constructor() {
    super();
    // Set max listeners to avoid memory leak warnings in complex integrations
    this.setMaxListeners(50);
  }

  /**
   * Overrides emit to log event dispatches for development tracing.
   */
  emit(eventName, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(`[Event Emitted] Name: "${eventName}"`, { argsCount: args.length });
    }
    return super.emit(eventName, ...args);
  }
}

const appEvents = new AppEventEmitter();

export default appEvents;
