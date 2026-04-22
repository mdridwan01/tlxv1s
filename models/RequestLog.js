const mongoose = require('mongoose');

/**
 * RequestLog Model
 * Logs all API requests for analytics and debugging
 */
const requestLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true,
    },
    path: {
      type: String,
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTime: {
      type: Number, // milliseconds
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deviceId: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    requestBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    queryParams: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true, expireAfterSeconds: 2592000 } // Auto-delete after 30 days
);

// Index for efficient queries
requestLogSchema.index({ createdAt: -1 });
requestLogSchema.index({ path: 1, createdAt: -1 });
requestLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('RequestLog', requestLogSchema);
