const RequestLog = require('../models/RequestLog');
const logger = require('../utils/logger');

/**
 * Request Logging Middleware
 * Logs all API requests for analytics
 */
const requestLoggingMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  res.json = function (data) {
    const responseTime = Date.now() - startTime;

    // Log request (non-blocking)
    logRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userId: req.user?.id || null,
      deviceId: req.query.deviceId || null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      error: res.statusCode >= 400 ? data.message : null,
      queryParams: req.query,
    }).catch((err) => {
      logger.warn(`⚠️ Failed to log request: ${err.message}`);
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Helper function to log request to database
 */
const logRequest = async (logData) => {
  try {
    await RequestLog.create(logData);
  } catch (error) {
    logger.warn(`⚠️ Request logging error: ${error.message}`);
  }
};

module.exports = {
  requestLoggingMiddleware,
};
