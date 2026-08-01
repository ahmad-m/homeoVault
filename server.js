import app from './app.js';
import config from './backend/config/config.js';
import logger from './backend/utils/logger.js';
import { close as closeDbPool } from './backend/database/connectionPool.js';
import schedulerService from './backend/services/scheduler.service.js';

const server = app.listen(config.port, () => {
  logger.info(`Server started in [${config.env}] mode on port: ${config.port}`);
  logger.info(`Access application: http://localhost:${config.port}`);
  
  // Start scheduled background sweeps loops
  schedulerService.start();
});

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop background scheduler tasks
  schedulerService.stop();
  
  // Stop receiving requests on HTTP server
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    // Shut down database pool
    await closeDbPool();
    
    logger.info('Graceful shutdown completed.');
    process.exit(0);
  });
  
  // Force termination after 5 seconds if connections hang
  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing process termination.');
    process.exit(1);
  }, 5000);
};

// Register signal listeners
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down gracefully...', {
    message: err.message,
    stack: err.stack
  });
  
  server.close(async () => {
    await closeDbPool();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down gracefully...', {
    message: err.message,
    stack: err.stack
  });
  
  server.close(async () => {
    await closeDbPool();
    process.exit(1);
  });
});
