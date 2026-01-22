import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { emailInboundService } from './services/emailInbound.service.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Initialize email monitoring
async function initEmailMonitoring() {
  console.log('');
  logger.info('EMAIL', '════════════════════════════════════════════════');
  logger.info('EMAIL', '  Email Scanning Service - Initializing...');
  logger.info('EMAIL', '════════════════════════════════════════════════');

  try {
    await emailInboundService.connect();
    if (emailInboundService.isConnected()) {
      await emailInboundService.startMonitoring('INBOX');
      const status = emailInboundService.getStatus();
      logger.success('EMAIL', '────────────────────────────────────────────────');
      logger.success('EMAIL', '  ✓ Email Scanning Service STARTED');
      logger.success('EMAIL', `  ✓ Monitoring: ${status.email}`);
      logger.success('EMAIL', `  ✓ IMAP Host: ${status.host}`);
      logger.success('EMAIL', `  ✓ Folder: ${status.currentFolder}`);
      logger.success('EMAIL', '  ✓ Status: IDLE - Waiting for new emails...');
      logger.success('EMAIL', '────────────────────────────────────────────────');
      console.log('');
    } else {
      logger.warn('EMAIL', 'Email service not connected - scanning disabled');
    }
  } catch (error) {
    logger.error('EMAIL', `Failed to initialize: ${error.message}`);
    logger.warn('EMAIL', 'Email scanning service disabled - server continues without it');
    // Don't crash the server if email monitoring fails
  }
}

// Start server
async function start() {
  app.listen(config.port, async () => {
    logger.banner('Silver Gate API', config.port, config.nodeEnv);
    logger.info('SERVER', `CORS origins: ${config.corsOrigins.join(', ')}`);

    // Initialize email monitoring after server starts
    await initEmailMonitoring();
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.warn('SERVER', 'Shutting down (SIGINT)...');
  emailInboundService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.warn('SERVER', 'Shutting down (SIGTERM)...');
  emailInboundService.disconnect();
  process.exit(0);
});

start();

export default app;
