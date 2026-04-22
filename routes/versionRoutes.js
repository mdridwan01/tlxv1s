const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * Public Routes
 */

// Get latest version
router.get('/latest', versionController.getLatestVersion);

// Check for update
router.get('/check/:currentVersionCode', versionController.checkForUpdate);

// Record download
router.post('/:id/download', versionController.recordDownload);

/**
 * Protected Routes (Admin Only)
 */

// Get all versions
router.get('/', authMiddleware, authorize('admin'), versionController.getAllVersions);

// Create version
router.post('/', authMiddleware, authorize('admin'), versionController.createVersion);

// Update version
router.put('/:id', authMiddleware, authorize('admin'), versionController.updateVersion);

module.exports = router;
