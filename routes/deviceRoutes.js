const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * Public Routes
 */

// Register device
router.post('/register', deviceController.registerDevice);

// Get single device
router.get('/:deviceId', deviceController.getDevice);

// Add to favorites
router.post('/:deviceId/favorites', deviceController.addFavorite);

// Track watch history
router.post('/:deviceId/watch-history', deviceController.trackWatchHistory);

/**
 * Protected Routes (Admin Only)
 */

// Get all devices
router.get('/', authMiddleware, authorize('admin'), deviceController.getAllDevices);

// Get device stats
router.get('/stats/summary', authMiddleware, authorize('admin'), deviceController.getDeviceStats);

module.exports = router;
