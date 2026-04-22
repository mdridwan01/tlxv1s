const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AppError, validateEmail, formatResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Admin Login Controller
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json(
        formatResponse(false, 'Email and password are required')
      );
    }

    if (!validateEmail(email)) {
      return res.status(400).json(
        formatResponse(false, 'Invalid email format')
      );
    }

    // Find user and get password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      logger.warn(`⚠️ Login attempt with non-existent email: ${email}`);
      return res.status(401).json(
        formatResponse(false, 'Invalid credentials')
      );
    }

    // Check if account is locked
    if (user.isLocked()) {
      logger.warn(`⚠️ Login attempt on locked account: ${email}`);
      return res.status(401).json(
        formatResponse(false, 'Account is locked. Try again later.')
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json(
        formatResponse(false, 'Account is inactive')
      );
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      logger.warn(`⚠️ Failed login attempt for user: ${email}`);
      return res.status(401).json(
        formatResponse(false, 'Invalid credentials')
      );
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`✅ User logged in: ${email}`);

    return res.status(200).json(
      formatResponse(true, 'Login successful', {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Login Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Login failed')
    );
  }
};

/**
 * Refresh Token Controller
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json(
        formatResponse(false, 'Refresh token is required')
      );
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json(
        formatResponse(false, 'Invalid or expired refresh token')
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json(
        formatResponse(false, 'User not found or inactive')
      );
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    return res.status(200).json(
      formatResponse(true, 'Token refreshed', {
        accessToken: newAccessToken,
      })
    );
  } catch (error) {
    logger.error(`❌ Refresh Token Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Token refresh failed')
    );
  }
};

/**
 * Get Current User Controller
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    return res.status(200).json(
      formatResponse(true, 'User fetched successfully', {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Get Current User Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch user')
    );
  }
};

/**
 * Logout Controller
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    logger.info(`✅ User logged out: ${req.user.email}`);
    return res.status(200).json(
      formatResponse(true, 'Logout successful')
    );
  } catch (error) {
    logger.error(`❌ Logout Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Logout failed')
    );
  }
};

/**
 * Create User (Admin Only)
 * POST /api/auth/users
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json(
        formatResponse(false, 'Email, password, and name are required')
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(
        formatResponse(false, 'User already exists')
      );
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      role: role || 'editor',
    });

    logger.info(`✅ New user created: ${email}`);

    return res.status(201).json(
      formatResponse(true, 'User created successfully', {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Create User Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to create user')
    );
  }
};
