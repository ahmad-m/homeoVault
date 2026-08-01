import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import logger from './backend/utils/logger.js';
import errorHandler from './backend/middleware/error.middleware.js';
import viewRoutes from './backend/routes/view.routes.js';
import healthRoutes from './backend/routes/health.routes.js';
import authRoutes from './backend/routes/auth.routes.js';
import userRoutes from './backend/routes/user.routes.js';
import medicineRoutes from './backend/routes/medicine.routes.js';
import inventoryRoutes from './backend/routes/inventory.routes.js';
import dashboardRoutes from './backend/routes/dashboard.routes.js';
import reportRoutes from './backend/routes/report.routes.js';
import notificationRoutes from './backend/routes/notification.routes.js';
import settingsRoutes from './backend/routes/settings.routes.js';
import { get404Page } from './backend/controllers/view.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 1. Mount Security Headers (Helmet)
// Disable ContentSecurityPolicy check defaults to permit loading local styling fonts and assets
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Custom CORS Configuration Middleware
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:3000', 'https://homeovault.onrender.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 2. Redirect Morgan server requests logs to custom logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// 3. Body and Cookie Parsers
app.use(express.json({ limit: '20mb' })); // Support larger bulk uploads text
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// 4. Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// 5. Mount API and View Routers
app.use('/', viewRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', medicineRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', reportRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);

// 6. Catch-all 404 handler
app.use(get404Page);

// 7. Global error handling middleware (must be registered last)
app.use(errorHandler);

export default app;
