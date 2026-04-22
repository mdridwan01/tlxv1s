const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/auth');

/**
 * Public Routes
 */

// Login
router.post('/login', authController.login);

// Refresh Token
router.post('/refresh', authController.refreshToken);

/**
 * Protected Routes
 */

// Get current user
router.get('/me', authMiddleware, authController.getCurrentUser);

// Logout
router.post('/logout', authMiddleware, authController.logout);

/**
 * Admin Only Routes
 */

// Create new user
router.post('/users', authMiddleware, authorize('admin'), authController.createUser);

module.exports = router;
