const mongoose = require('mongoose');

/**
 * Config Model
 * Dynamic app configuration controlled by admin
 */
const configSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    apiUrl: {
      type: String,
      default: 'https://api.iptv-saas.com',
    },
    latestVersion: {
      type: String,
      default: '1.0.0',
    },
    forceUpdate: {
      type: Boolean,
      default: false,
    },
    apkUrl: {
      type: String,
      default: '',
    },
    maintenance: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'Server is under maintenance. Please try again later.',
    },
    features: {
      ads: { type: Boolean, default: true },
      newUi: { type: Boolean, default: false },
      offlineMode: { type: Boolean, default: false },
      chromecast: { type: Boolean, default: true },
      downloads: { type: Boolean, default: false },
      recommendations: { type: Boolean, default: true },
      parentalControl: { type: Boolean, default: true },
    },
    apiUrls: [
      {
        url: String,
        priority: Number,
        isActive: Boolean,
      },
    ],
    cdnUrl: {
      type: String,
      default: 'https://cdn.iptv-saas.com',
    },
    supportEmail: {
      type: String,
      default: 'support@iptv-saas.com',
    },
    supportUrl: {
      type: String,
      default: 'https://support.iptv-saas.com',
    },
    privacyUrl: {
      type: String,
      default: 'https://privacy.iptv-saas.com',
    },
    termsUrl: {
      type: String,
      default: 'https://terms.iptv-saas.com',
    },
    proxyFallback: {
      enabled: { type: Boolean, default: false },
      proxies: [String],
    },
    rateLimiting: {
      enabled: { type: Boolean, default: true },
      windowMs: { type: Number, default: 900000 }, // 15 minutes
      maxRequests: { type: Number, default: 100 },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Get or create singleton config
configSchema.statics.getConfig = async function () {
  let config = await this.findOne({ configKey: 'DEFAULT' });
  if (!config) {
    config = await this.create({ configKey: 'DEFAULT' });
  }
  return config;
};

module.exports = mongoose.model('Config', configSchema);
