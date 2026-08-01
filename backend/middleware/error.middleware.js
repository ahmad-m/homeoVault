import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWS_DIR = path.join(__dirname, '../../views');

/**
 * Express global error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const statusMessage = err.message || 'Internal Server Error';
  
  // Log error details
  logger.error(`${req.method} ${req.originalUrl} - Status: ${statusCode} - Error: ${statusMessage}`, {
    stack: config.isDevelopment ? err.stack : undefined
  });

  // Check if API request
  if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      error: {
        message: statusMessage,
        status: statusCode,
        ...(config.isDevelopment && { stack: err.stack })
      }
    });
  }

  // Otherwise, serve HTML error page
  const errorPagePath = path.join(VIEWS_DIR, 'error.html');
  
  if (fs.existsSync(errorPagePath)) {
    try {
      let html = fs.readFileSync(errorPagePath, 'utf8');
      
      // Basic dynamic replacement in HTML template
      html = html
        .replace('{{ERROR_STATUS}}', statusCode)
        .replace('{{ERROR_TITLE}}', statusCode === 404 ? 'Page Not Found' : 'Something Went Wrong')
        .replace('{{ERROR_MESSAGE}}', statusMessage)
        .replace('{{ERROR_STACK}}', config.isDevelopment && err.stack ? `<pre>${err.stack}</pre>` : '');

      return res.status(statusCode).send(html);
    } catch (fsErr) {
      logger.error('Failed to read error.html file:', fsErr);
    }
  }

  // Fallback if error.html cannot be served
  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>System Error - HomeoVault</title>
      <style>
        body { font-family: system-ui; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc; }
        h1 { color: #f43f5e; }
      </style>
    </head>
    <body>
      <h1>Error ${statusCode}</h1>
      <p>${statusMessage}</p>
    </body>
    </html>
  `);
};

export default errorHandler;
