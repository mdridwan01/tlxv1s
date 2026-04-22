const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Channel = require('../models/Channel');
const Version = require('../models/Version');
const Config = require('../models/Config');
const Device = require('../models/Device');

const logger = require('../utils/logger');

/**
 * Seed Database with Sample Data
 */
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iptv-saas');
    logger.info('Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    await User.deleteMany({});
    await Channel.deleteMany({});
    await Version.deleteMany({});
    await Config.deleteMany({});
    await Device.deleteMany({});
    logger.info('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      email: 'admin@iptv-saas.com',
      password: 'admin123', // Will be hashed
      name: 'Admin User',
      role: 'admin',
      isActive: true,
    });
    logger.info('✅ Admin user created');

    // Create editor user
    const editor = await User.create({
      email: 'editor@iptv-saas.com',
      password: 'editor123',
      name: 'Editor User',
      role: 'editor',
      isActive: true,
    });
    logger.info('✅ Editor user created');

    // Create sample channels
    const channels = await Channel.insertMany([
      {
        name: 'Sports Premium',
        category: 'Sports',
        country: 'Global',
        description: 'Live sports from around the world',
        sources: [
          {
            name: 'Primary Stream',
            url: 'http://stream1.example.com/sports',
            priority: 1,
            isActive: true,
            backup: 'http://backup1.example.com/sports',
          },
          {
            name: 'Backup Stream',
            url: 'http://stream2.example.com/sports',
            priority: 2,
            isActive: true,
          },
        ],
        thumbnail: 'https://via.placeholder.com/300x200?text=Sports+Premium',
        status: 'active',
        views: 15000,
        rating: 4.5,
        tags: ['sports', 'live', 'international'],
      },
      {
        name: 'Movies HD',
        category: 'Movies',
        country: 'Global',
        description: 'Latest movies in HD quality',
        sources: [
          {
            name: 'Primary',
            url: 'http://stream1.example.com/movies',
            priority: 1,
            isActive: true,
          },
        ],
        thumbnail: 'https://via.placeholder.com/300x200?text=Movies+HD',
        status: 'active',
        views: 12000,
        rating: 4.8,
        tags: ['movies', 'entertainment'],
      },
      {
        name: 'News 24/7',
        category: 'News',
        country: 'Global',
        description: 'Breaking news and updates',
        sources: [
          {
            name: 'Primary',
            url: 'http://stream1.example.com/news',
            priority: 1,
            isActive: true,
          },
        ],
        thumbnail: 'https://via.placeholder.com/300x200?text=News+24/7',
        status: 'active',
        views: 8000,
        rating: 4.2,
        tags: ['news', 'current-affairs'],
      },
      {
        name: 'Kids Zone',
        category: 'Kids',
        country: 'Global',
        description: 'Safe content for children',
        sources: [
          {
            name: 'Primary',
            url: 'http://stream1.example.com/kids',
            priority: 1,
            isActive: true,
          },
        ],
        thumbnail: 'https://via.placeholder.com/300x200?text=Kids+Zone',
        status: 'active',
        views: 5000,
        rating: 4.9,
        tags: ['kids', 'educational'],
      },
      {
        name: 'Music Video Hits',
        category: 'Music',
        country: 'Global',
        description: 'Top music videos 24/7',
        sources: [
          {
            name: 'Primary',
            url: 'http://stream1.example.com/music',
            priority: 1,
            isActive: true,
          },
        ],
        thumbnail: 'https://via.placeholder.com/300x200?text=Music+Video+Hits',
        status: 'active',
        views: 10000,
        rating: 4.6,
        tags: ['music', 'videos'],
      },
    ]);
    logger.info(`✅ Created ${channels.length} sample channels`);

    // Create app version
    const version = await Version.create({
      version: '1.0.0',
      versionCode: 1,
      apkUrl: 'https://example.com/app-v1.0.0.apk',
      changelog: 'Initial release',
      releaseNotes: 'First version of IPTV app',
      forceUpdate: false,
      minVersionCode: 0,
      isActive: true,
      fileSize: 52428800, // 50MB
      checksum: 'a1b2c3d4e5f6',
    });
    logger.info('✅ Created app version');

    // Create configuration
    const config = await Config.create({
      configKey: 'DEFAULT',
      apiUrl: 'https://api.iptv-saas.com',
      latestVersion: '1.0.0',
      forceUpdate: false,
      apkUrl: 'https://example.com/app.apk',
      maintenance: false,
      features: {
        ads: true,
        newUi: false,
        offlineMode: false,
        chromecast: true,
        downloads: false,
        recommendations: true,
        parentalControl: true,
      },
      apiUrls: [
        {
          url: 'https://api1.iptv-saas.com',
          priority: 1,
          isActive: true,
        },
        {
          url: 'https://api2.iptv-saas.com',
          priority: 2,
          isActive: true,
        },
      ],
      cdnUrl: 'https://cdn.iptv-saas.com',
      supportEmail: 'support@iptv-saas.com',
      supportUrl: 'https://support.iptv-saas.com',
      privacyUrl: 'https://privacy.iptv-saas.com',
      termsUrl: 'https://terms.iptv-saas.com',
      updatedBy: admin._id,
    });
    logger.info('✅ Created app configuration');

    // Create sample devices
    const devices = await Device.insertMany([
      {
        deviceId: 'device-uuid-001',
        appVersion: '1.0.0',
        deviceModel: 'Samsung Galaxy S21',
        osVersion: '11',
        osType: 'Android',
        manufacturer: 'Samsung',
        country: 'US',
        isActive: true,
        requestCount: 1250,
        totalWatchTime: 456000,
        favoriteChannels: [channels[0]._id, channels[1]._id],
      },
      {
        deviceId: 'device-uuid-002',
        appVersion: '1.0.0',
        deviceModel: 'iPhone 12',
        osVersion: '14',
        osType: 'iOS',
        manufacturer: 'Apple',
        country: 'UK',
        isActive: true,
        requestCount: 890,
        totalWatchTime: 234000,
        favoriteChannels: [channels[2]._id],
      },
      {
        deviceId: 'device-uuid-003',
        appVersion: '1.0.0',
        deviceModel: 'Xiaomi Redmi Note 10',
        osVersion: '11',
        osType: 'Android',
        manufacturer: 'Xiaomi',
        country: 'India',
        isActive: false,
        requestCount: 450,
        totalWatchTime: 120000,
        favoriteChannels: [channels[0]._id, channels[2]._id],
      },
    ]);
    logger.info(`✅ Created ${devices.length} sample devices`);

    logger.info('✅ Database seeding completed successfully!');
    logger.info(`
    ====================================
    Sample Credentials:
    ====================================
    Admin:
    Email: admin@iptv-saas.com
    Password: admin123

    Editor:
    Email: editor@iptv-saas.com
    Password: editor123
    ====================================
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
