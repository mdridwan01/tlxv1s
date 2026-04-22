const redis = require('redis');
const logger = require('../utils/logger');

let client;

/**
 * Redis Connection
 * Used for caching channels, config, and sessions
 */
const connectRedis = async () => {
  try {
    let connectionErrorLogged = false;

    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: () => false, // Disable automatic reconnection
        connectTimeout: 5000, // 5 second timeout
      },
    });

    client.on('error', (error) => {
      if (!connectionErrorLogged) {
        logger.warn(`⚠️ Redis unavailable: ${error.message}. Using app without cache.`);
        connectionErrorLogged = true;
      }
    });

    client.on('connect', () => {
      logger.info('✅ Redis Connected');
      connectionErrorLogged = false; // Reset flag on successful connection
    });

    // Set a timeout for connection attempt
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
    });

    await Promise.race([client.connect(), timeoutPromise]);
    return client;
  } catch (error) {
    logger.warn(`⚠️ Redis unavailable: ${error.message}. Using app without cache.`);
    client = null; // Ensure client is null if connection fails
    return null;
  }
};

/**
 * Get Redis Client
 */
const getRedisClient = () => client;

/**
 * Cache Helper - Set
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    if (!client || client.isOpen === false) return;
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    // Only log if it's not a "client is closed" error to avoid spam
    if (!error.message.includes('The client is closed')) {
      logger.warn(`⚠️ Cache Set Error: ${error.message}`);
    }
  }
};

/**
 * Cache Helper - Get
 */
const getCache = async (key) => {
  try {
    if (!client || client.isOpen === false) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Only log if it's not a "client is closed" error to avoid spam
    if (!error.message.includes('The client is closed')) {
      logger.warn(`⚠️ Cache Get Error: ${error.message}`);
    }
    return null;
  }
};

/**
 * Cache Helper - Delete
 */
const deleteCache = async (key) => {
  try {
    if (!client || client.isOpen === false) return;
    await client.del(key);
  } catch (error) {
    // Only log if it's not a "client is closed" error to avoid spam
    if (!error.message.includes('The client is closed')) {
      logger.warn(`⚠️ Cache Delete Error: ${error.message}`);
    }
  }
};

/**
 * Cache Helper - Clear All
 */
const clearCache = async () => {
  try {
    if (!client || client.isOpen === false) return;
    await client.flushDb();
    logger.info('✅ Cache Cleared');
  } catch (error) {
    // Only log if it's not a "client is closed" error to avoid spam
    if (!error.message.includes('The client is closed')) {
      logger.warn(`⚠️ Cache Clear Error: ${error.message}`);
    }
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCache,
};
