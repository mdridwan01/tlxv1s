const mongoose = require('mongoose');

/**
 * Version Model
 * Manages app versions and force update flags
 */
const versionSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      match: /^\d+\.\d+\.\d+$/,
    },
    versionCode: {
      type: Number,
      required: true,
      unique: true,
    },
    apkUrl: {
      type: String,
      required: true,
    },
    changelog: {
      type: String,
      default: '',
    },
    releaseNotes: {
      type: String,
      default: '',
    },
    forceUpdate: {
      type: Boolean,
      default: false,
    },
    minVersionCode: {
      type: Number,
      default: 0, // Devices below this version must update
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    checksum: {
      type: String,
      default: null, // MD5 or SHA256 for integrity verification
    },
  },
  { timestamps: true }
);

// Get latest active version
versionSchema.statics.getLatestVersion = async function () {
  return this.findOne({ isActive: true }).sort({ versionCode: -1 }).exec();
};

module.exports = mongoose.model('Version', versionSchema);
