const Device = require('../models/Device');
const Channel = require('../models/Channel');
const RequestLog = require('../models/RequestLog');
const { formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Get Dashboard Statistics
 * GET /api/analytics/dashboard
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total registered devices
    const totalDevices = await Device.countDocuments();

    // Active devices (last 24 hours)
    const activeDevices24h = await Device.countDocuments({
      lastActive: { $gte: last24h },
      isActive: true,
    });

    // Active devices (last 7 days)
    const activeDevices7d = await Device.countDocuments({
      lastActive: { $gte: last7d },
      isActive: true,
    });

    // Total channels
    const totalChannels = await Channel.countDocuments();

    // Active channels
    const activeChannels = await Channel.countDocuments({ status: 'active' });

    // Total views
    const totalViews = await Channel.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);

    // API requests today
    const apiRequestsToday = await RequestLog.countDocuments({
      createdAt: { $gte: last24h },
    });

    // Error rate
    const totalRequests = await RequestLog.countDocuments({
      createdAt: { $gte: last24h },
    });
    const errorRequests = await RequestLog.countDocuments({
      createdAt: { $gte: last24h },
      statusCode: { $gte: 400 },
    });
    const errorRate = totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : 0;

    return res.status(200).json(
      formatResponse(true, 'Dashboard stats fetched successfully', {
        totalDevices,
        activeDevices24h,
        activeDevices7d,
        totalChannels,
        activeChannels,
        totalViews: totalViews[0]?.totalViews || 0,
        apiRequestsToday,
        errorRate: `${errorRate}%`,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Dashboard Stats Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch dashboard stats')
    );
  }
};

/**
 * Get User Growth Chart Data
 * GET /api/analytics/user-growth?days=30
 */
exports.getUserGrowth = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days), 365);

    const data = await Device.aggregate([
      {
        $match: {
          firstSeen: {
            $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$firstSeen' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json(
      formatResponse(true, 'User growth data fetched successfully', {
        data,
        period: `${daysNum} days`,
      })
    );
  } catch (error) {
    logger.error(`❌ Get User Growth Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch user growth data')
    );
  }
};

/**
 * Get Channel Views Chart
 * GET /api/analytics/channel-views?limit=10
 */
exports.getChannelViews = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const topChannels = await Channel.find()
      .select('name views thumbnail')
      .sort({ views: -1 })
      .limit(parseInt(limit))
      .lean();

    return res.status(200).json(
      formatResponse(true, 'Top channels fetched successfully', {
        data: topChannels,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Channel Views Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch channel views')
    );
  }
};

/**
 * Get Device Statistics by Country
 * GET /api/analytics/devices-by-country
 */
exports.getDevicesByCountry = async (req, res, next) => {
  try {
    const data = await Device.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 },
          activeCount: {
            $sum: {
              $cond: ['$isActive', 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json(
      formatResponse(true, 'Device stats by country fetched successfully', {
        data,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Devices by Country Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch device stats')
    );
  }
};

/**
 * Get Device Statistics by OS
 * GET /api/analytics/devices-by-os
 */
exports.getDevicesByOS = async (req, res, next) => {
  try {
    const data = await Device.aggregate([
      {
        $group: {
          _id: '$osType',
          count: { $sum: 1 },
          avgVersion: { $avg: '$appVersion' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json(
      formatResponse(true, 'Device stats by OS fetched successfully', {
        data,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Devices by OS Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch device stats')
    );
  }
};

/**
 * Get API Performance Stats
 * GET /api/analytics/api-performance?days=7
 */
exports.getAPIPerformance = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = Math.min(parseInt(days), 90);

    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const data = await RequestLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json(
      formatResponse(true, 'API performance data fetched successfully', {
        data,
        period: `${daysNum} days`,
      })
    );
  } catch (error) {
    logger.error(`❌ Get API Performance Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch API performance data')
    );
  }
};

/**
 * Get Top Errors
 * GET /api/analytics/top-errors?limit=10
 */
exports.getTopErrors = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const errors = await RequestLog.aggregate([
      {
        $match: {
          statusCode: { $gte: 400 },
          error: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$error',
          count: { $sum: 1 },
          lastOccurred: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);

    return res.status(200).json(
      formatResponse(true, 'Top errors fetched successfully', {
        data: errors,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Top Errors Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch top errors')
    );
  }
};
