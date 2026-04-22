const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * Public Routes
 */

// Get all channels
router.get('/', channelController.getAllChannels);

// Get single channel
router.get('/:id', channelController.getChannel);

/**
 * Protected Routes (Admin/Editor)
 */

// Create channel
router.post(
  '/',
  authMiddleware,
  authorize('admin', 'editor'),
  channelController.createChannel
);

// Update channel
router.put(
  '/:id',
  authMiddleware,
  authorize('admin', 'editor'),
  channelController.updateChannel
);

// Delete channel
router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  channelController.deleteChannel
);

// Bulk update (reorder)
router.post(
  '/bulk/update',
  authMiddleware,
  authorize('admin'),
  channelController.bulkUpdateChannels
);

module.exports = router;
