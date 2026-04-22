const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * All analytics routes require admin access
 */

// Get dashboard statistics
router.get(
  '/dashboard',
  authMiddleware,
  authorize('admin'),
  analyticsController.getDashboardStats
);

// Get user growth data
router.get(
  '/user-growth',
  authMiddleware,
  authorize('admin'),
  analyticsController.getUserGrowth
);

// Get channel views
router.get(
  '/channel-views',
  authMiddleware,
  authorize('admin'),
  analyticsController.getChannelViews
);

// Get devices by country
router.get(
  '/devices-by-country',
  authMiddleware,
  authorize('admin'),
  analyticsController.getDevicesByCountry
);

// Get devices by OS
router.get(
  '/devices-by-os',
  authMiddleware,
  authorize('admin'),
  analyticsController.getDevicesByOS
);

// Get API performance
router.get(
  '/api-performance',
  authMiddleware,
  authorize('admin'),
  analyticsController.getAPIPerformance
);

// Get top errors
router.get(
  '/top-errors',
  authMiddleware,
  authorize('admin'),
  analyticsController.getTopErrors
);

module.exports = router;
