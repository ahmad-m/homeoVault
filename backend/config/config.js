import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
  
  // Database Configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'homeovault',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT, 10) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT, 10) || 2000
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_jwt_key_2026_homeovault_token',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

export default config;
