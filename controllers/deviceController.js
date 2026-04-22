const Device = require('../models/Device');
const { formatResponse, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Register Device
 * POST /api/device/register
 */
exports.registerDevice = async (req, res, next) => {
  try {
    const {
      deviceId,
      appVersion,
      deviceModel,
      osVersion,
      osType,
      manufacturer,
      country,
      ipAddress,
    } = req.body;

    if (!deviceId) {
      return res.status(400).json(
        formatResponse(false, 'Device ID is required')
      );
    }

    // Check if device already exists
    let device = await Device.findOne({ deviceId });

    if (device) {
      // Update existing device
      device.lastActive = new Date();
      device.appVersion = appVersion || device.appVersion;
      device.deviceModel = deviceModel || device.deviceModel;
      device.osVersion = osVersion || device.osVersion;
      device.osType = osType || device.osType;
      device.manufacturer = manufacturer || device.manufacturer;
      device.country = country || device.country;
      device.ipAddress = ipAddress || device.ipAddress;
      device.requestCount += 1;
      await device.save();

      logger.info(`✅ Device updated: ${deviceId}`);

      return res.status(200).json(
        formatResponse(true, 'Device updated successfully', {
          device: {
            deviceId: device.deviceId,
            appVersion: device.appVersion,
            lastActive: device.lastActive,
          },
        })
      );
    }

    // Create new device
    device = await Device.create({
      deviceId,
      appVersion: appVersion || '1.0.0',
      deviceModel: deviceModel || 'Unknown',
      osVersion: osVersion || 'Unknown',
      osType: osType || 'Unknown',
      manufacturer: manufacturer || 'Unknown',
      country: country || 'Unknown',
      ipAddress: ipAddress || null,
      isActive: true,
    });

    logger.info(`✅ New device registered: ${deviceId}`);

    return res.status(201).json(
      formatResponse(true, 'Device registered successfully', {
        device: {
          deviceId: device.deviceId,
          appVersion: device.appVersion,
          registeredAt: device.firstSeen,
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Register Device Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to register device')
    );
  }
};

/**
 * Get All Devices (Admin)
 * GET /api/device
 */
exports.getAllDevices = async (req, res, next) => {
  try {
    const { page, limit, isActive, country } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Build query
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (country) {
      query.country = country;
    }

    const total = await Device.countDocuments(query);
    const devices = await Device.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ lastActive: -1 })
      .lean();

    return res.status(200).json(
      formatResponse(true, 'Devices fetched successfully', {
        devices,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Get Devices Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch devices')
    );
  }
};

/**
 * Get Single Device
 * GET /api/device/:deviceId
 */
exports.getDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId }).populate(
      'favoriteChannels',
      'name thumbnail category'
    );

    if (!device) {
      return res.status(404).json(
        formatResponse(false, 'Device not found')
      );
    }

    return res.status(200).json(
      formatResponse(true, 'Device fetched successfully', {
        device,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Device Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch device')
    );
  }
};

/**
 * Add to Favorites
 * POST /api/device/:deviceId/favorites
 */
exports.addFavorite = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json(
        formatResponse(false, 'Channel ID is required')
      );
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $addToSet: { favoriteChannels: channelId } },
      { new: true }
    ).populate('favoriteChannels', 'name thumbnail');

    if (!device) {
      return res.status(404).json(
        formatResponse(false, 'Device not found')
      );
    }

    logger.info(`✅ Channel added to favorites for device: ${deviceId}`);

    return res.status(200).json(
      formatResponse(true, 'Channel added to favorites', {
        favorites: device.favoriteChannels,
      })
    );
  } catch (error) {
    logger.error(`❌ Add Favorite Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to add to favorites')
    );
  }
};

/**
 * Track Watch History
 * POST /api/device/:deviceId/watch-history
 */
exports.trackWatchHistory = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { channelId, duration } = req.body;

    if (!channelId || duration === undefined) {
      return res.status(400).json(
        formatResponse(false, 'Channel ID and duration are required')
      );
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        $push: {
          watchHistory: {
            channelId,
            watchedAt: new Date(),
            duration,
          },
        },
        $inc: { totalWatchTime: duration },
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json(
        formatResponse(false, 'Device not found')
      );
    }

    return res.status(200).json(
      formatResponse(true, 'Watch history tracked successfully')
    );
  } catch (error) {
    logger.error(`❌ Track Watch History Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to track watch history')
    );
  }
};

/**
 * Get Device Stats
 * GET /api/device/stats/summary
 */
exports.getDeviceStats = async (req, res, next) => {
  try {
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({
      isActive: true,
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const devicesByCountry = await Device.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const devicesByOS = await Device.aggregate([
      { $group: { _id: '$osType', count: { $sum: 1 } } },
    ]);

    return res.status(200).json(
      formatResponse(true, 'Device stats fetched successfully', {
        totalDevices,
        activeDevices,
        devicesByCountry,
        devicesByOS,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Device Stats Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch device stats')
    );
  }
};
