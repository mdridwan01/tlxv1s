const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB Database Connection
 * Handles connection pooling and error handling
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`❌ MongoDB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect Database
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✅ MongoDB Disconnected');
  } catch (error) {
    logger.error(`❌ MongoDB Disconnection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, disconnectDB };
