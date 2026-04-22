const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const { requestLoggingMiddleware } = require('./middleware/logging');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const configRoutes = require('./routes/configRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const versionRoutes = require('./routes/versionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

/**
 * Security & Performance Middleware
 */

// Helmet - Security headers
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW || 900000),
  max: parseInt(process.env.API_RATE_LIMIT_MAX || 100),
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request logging
app.use(requestLoggingMiddleware);

/**
 * Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/config', configRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/analytics', analyticsRoutes);

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'IPTV SaaS API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Server Initialization
 */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server started on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
    });

    /**
     * WebSocket Setup (Socket.io for Real-time Updates)
     */
    const io = require('socket.io')(server, {
      cors: corsOptions,
    });

    // Real-time connections
    io.on('connection', (socket) => {
      logger.info(`✅ WebSocket Connected: ${socket.id}`);

      // Join room for dashboard stats
      socket.on('join-dashboard', () => {
        socket.join('dashboard');
        logger.info(`📊 Client joined dashboard: ${socket.id}`);
      });

      // Broadcast active user count every 5 seconds
      const dashboardInterval = setInterval(() => {
        io.to('dashboard').emit('active-users', {
          count: io.engine.clientsCount,
          timestamp: new Date(),
        });
      }, 5000);

      // Disconnect handler
      socket.on('disconnect', () => {
        logger.info(`❌ WebSocket Disconnected: ${socket.id}`);
        clearInterval(dashboardInterval);
      });
    });

    /**
     * Graceful Shutdown
     */
    process.on('SIGTERM', async () => {
      logger.info('⚠️ SIGTERM received, shutting down gracefully');
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error(`❌ Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
