const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * Public Routes
 */

// Get config (public API for mobile apps)
router.get('/', configController.getConfig);

/**
 * Protected Routes (Admin Only)
 */

// Update config
router.put('/', authMiddleware, authorize('admin'), configController.updateConfig);

// Toggle feature flag
router.post(
  '/features/:featureName',
  authMiddleware,
  authorize('admin'),
  configController.toggleFeature
);

// Toggle maintenance mode
router.post(
  '/maintenance',
  authMiddleware,
  authorize('admin'),
  configController.toggleMaintenance
);

// Switch active API
router.post(
  '/api-switch',
  authMiddleware,
  authorize('admin'),
  configController.switchActiveAPI
);

module.exports = router;
