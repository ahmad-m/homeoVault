import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'combined.log');

// Ensure log directory exists
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create logs directory:', err.message);
}

// Log Levels
const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// ANSI Color Codes
const COLORS = {
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  CYAN: '\x1b[36m',
  MAGENTA: '\x1b[35m',
  GREY: '\x1b[90m',
  RESET: '\x1b[0m'
};

const getTimestamp = () => new Date().toISOString();

const formatLog = (level, message, meta = '') => {
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `[${getTimestamp()}] [${level}] ${message}${metaStr}`;
};

const writeToFile = (formattedMessage) => {
  try {
    fs.appendFileSync(LOG_FILE, formattedMessage + '\n', 'utf8');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
};

const logger = {
  info: (message, meta) => {
    const formatted = formatLog(LEVELS.INFO, message, meta);
    console.log(`${COLORS.GREEN}${formatted}${COLORS.RESET}`);
    writeToFile(formatted);
  },
  warn: (message, meta) => {
    const formatted = formatLog(LEVELS.WARN, message, meta);
    console.warn(`${COLORS.YELLOW}${formatted}${COLORS.RESET}`);
    writeToFile(formatted);
  },
  error: (message, meta) => {
    const formatted = formatLog(LEVELS.ERROR, message, meta);
    console.error(`${COLORS.RED}${formatted}${COLORS.RESET}`);
    writeToFile(formatted);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      const formatted = formatLog(LEVELS.DEBUG, message, meta);
      console.log(`${COLORS.GREY}${formatted}${COLORS.RESET}`);
      writeToFile(formatted);
    }
  }
};

export default logger;
