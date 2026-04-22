const mongoose = require('mongoose');

/**
 * Device Model
 * Tracks registered devices and their activity
 */
const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    deviceModel: {
      type: String,
      default: 'Unknown',
    },
    osVersion: {
      type: String,
      default: 'Unknown',
    },
    osType: {
      type: String,
      enum: ['Android', 'iOS', 'Windows', 'macOS', 'Linux', 'Unknown'],
      default: 'Unknown',
    },
    manufacturer: {
      type: String,
      default: 'Unknown',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    totalWatchTime: {
      type: Number,
      default: 0, // in seconds
    },
    favoriteChannels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
      },
    ],
    watchHistory: [
      {
        channelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Channel',
        },
        watchedAt: Date,
        duration: Number, // in seconds
      },
    ],
    customData: {
      type: Map,
      of: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
deviceSchema.index({ lastActive: -1 });
deviceSchema.index({ isActive: 1 });
deviceSchema.index({ country: 1 });

module.exports = mongoose.model('Device', deviceSchema);
