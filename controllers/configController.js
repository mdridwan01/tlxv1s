const Config = require('../models/Config');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

const CONFIG_CACHE_KEY = 'config:default';

/**
 * Get App Configuration (Public API)
 * GET /api/config
 */
exports.getConfig = async (req, res, next) => {
  try {
    // Try to get from cache
    const cachedConfig = await getCache(CONFIG_CACHE_KEY);
    if (cachedConfig) {
      return res.status(200).json({
        success: true,
        data: cachedConfig,
      });
    }

    // Get config from database
    let config = await Config.getConfig();

    const configData = {
      api_url: config.apiUrl,
      latest_version: config.latestVersion,
      force_update: config.forceUpdate,
      apk_url: config.apkUrl,
      maintenance: config.maintenance,
      features: config.features,
      cdnUrl: config.cdnUrl,
      supportEmail: config.supportEmail,
      privacyUrl: config.privacyUrl,
      termsUrl: config.termsUrl,
    };

    // Cache for 30 minutes
    await setCache(CONFIG_CACHE_KEY, configData, 1800);

    return res.status(200).json({
      success: true,
      data: configData,
    });
  } catch (error) {
    logger.error(`❌ Get Config Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
    });
  }
};

/**
 * Update Configuration (Admin Only)
 * PUT /api/config
 */
exports.updateConfig = async (req, res, next) => {
  try {
    const updateData = req.body;
    updateData.updatedBy = req.user._id;

    // Get or create config
    let config = await Config.getConfig();

    // Update fields
    Object.assign(config, updateData);
    await config.save();

    logger.info(`✅ Configuration updated by ${req.user.email}`);

    // Invalidate cache
    await deleteCache(CONFIG_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Configuration updated successfully', {
        config,
      })
    );
  } catch (error) {
    logger.error(`❌ Update Config Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to update configuration')
    );
  }
};

/**
 * Toggle Feature Flag
 * POST /api/config/features/:featureName
 */
exports.toggleFeature = async (req, res, next) => {
  try {
    const { featureName } = req.params;
    const { enabled } = req.body;

    const config = await Config.getConfig();

    if (!(featureName in config.features)) {
      return res.status(400).json(
        formatResponse(false, 'Feature not found')
      );
    }

    config.features[featureName] = enabled;
    await config.save();

    logger.info(`✅ Feature ${featureName} toggled to ${enabled}`);

    // Invalidate cache
    await deleteCache(CONFIG_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Feature toggled successfully', {
        feature: featureName,
        enabled,
      })
    );
  } catch (error) {
    logger.error(`❌ Toggle Feature Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to toggle feature')
    );
  }
};

/**
 * Toggle Maintenance Mode
 * POST /api/config/maintenance
 */
exports.toggleMaintenance = async (req, res, next) => {
  try {
    const { maintenance, message } = req.body;

    const config = await Config.getConfig();
    config.maintenance = maintenance;
    if (message) {
      config.maintenanceMessage = message;
    }
    await config.save();

    logger.info(`✅ Maintenance mode set to ${maintenance}`);

    // Invalidate cache
    await deleteCache(CONFIG_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Maintenance mode updated', {
        maintenance,
        message: config.maintenanceMessage,
      })
    );
  } catch (error) {
    logger.error(`❌ Toggle Maintenance Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to toggle maintenance mode')
    );
  }
};

/**
 * Switch Active API
 * POST /api/config/api-switch
 */
exports.switchActiveAPI = async (req, res, next) => {
  try {
    const { apiUrl } = req.body;

    if (!apiUrl) {
      return res.status(400).json(
        formatResponse(false, 'API URL is required')
      );
    }

    const config = await Config.getConfig();
    config.apiUrl = apiUrl;
    await config.save();

    logger.info(`✅ Active API switched to ${apiUrl}`);

    // Invalidate cache
    await deleteCache(CONFIG_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'API switched successfully', {
        apiUrl,
      })
    );
  } catch (error) {
    logger.error(`❌ Switch API Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to switch API')
    );
  }
};
