const Version = require('../models/Version');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { formatResponse, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

const VERSION_CACHE_KEY = 'version:latest';

/**
 * Get Latest Version
 * GET /api/version/latest
 */
exports.getLatestVersion = async (req, res, next) => {
  try {
    // Try cache first
    const cached = await getCache(VERSION_CACHE_KEY);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
      });
    }

    const version = await Version.getLatestVersion();

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'No version found',
      });
    }

    const versionData = {
      version: version.version,
      versionCode: version.versionCode,
      apkUrl: version.apkUrl,
      forceUpdate: version.forceUpdate,
      minVersionCode: version.minVersionCode,
      changelog: version.changelog,
      releaseNotes: version.releaseNotes,
    };

    // Cache for 1 hour
    await setCache(VERSION_CACHE_KEY, versionData, 3600);

    return res.status(200).json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    logger.error(`❌ Get Latest Version Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch latest version',
    });
  }
};

/**
 * Get All Versions (Admin)
 * GET /api/version
 */
exports.getAllVersions = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    const total = await Version.countDocuments();
    const versions = await Version.find()
      .skip(skip)
      .limit(limitNum)
      .sort({ versionCode: -1 })
      .lean();

    return res.status(200).json(
      formatResponse(true, 'Versions fetched successfully', {
        versions,
        pagination: {
          page: parseInt(page) || 1,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error) {
    logger.error(`❌ Get Versions Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch versions')
    );
  }
};

/**
 * Create Version
 * POST /api/version
 */
exports.createVersion = async (req, res, next) => {
  try {
    const {
      version,
      versionCode,
      apkUrl,
      changelog,
      releaseNotes,
      forceUpdate,
      minVersionCode,
      fileSize,
      checksum,
    } = req.body;

    // Validate required fields
    if (!version || !versionCode || !apkUrl) {
      return res.status(400).json(
        formatResponse(false, 'Version, version code, and APK URL are required')
      );
    }

    // Check if version already exists
    const existingVersion = await Version.findOne({ version });
    if (existingVersion) {
      return res.status(400).json(
        formatResponse(false, 'Version already exists')
      );
    }

    // Deactivate previous version
    await Version.updateOne({ isActive: true }, { isActive: false });

    // Create new version
    const newVersion = await Version.create({
      version,
      versionCode,
      apkUrl,
      changelog: changelog || '',
      releaseNotes: releaseNotes || '',
      forceUpdate: forceUpdate || false,
      minVersionCode: minVersionCode || 0,
      isActive: true,
      fileSize: fileSize || 0,
      checksum: checksum || null,
    });

    logger.info(`✅ New version created: ${version}`);

    // Invalidate cache
    await deleteCache(VERSION_CACHE_KEY);

    return res.status(201).json(
      formatResponse(true, 'Version created successfully', {
        version: newVersion,
      })
    );
  } catch (error) {
    logger.error(`❌ Create Version Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to create version')
    );
  }
};

/**
 * Update Version
 * PUT /api/version/:id
 */
exports.updateVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const version = await Version.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!version) {
      return res.status(404).json(
        formatResponse(false, 'Version not found')
      );
    }

    logger.info(`✅ Version updated: ${version.version}`);

    // Invalidate cache
    await deleteCache(VERSION_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Version updated successfully', {
        version,
      })
    );
  } catch (error) {
    logger.error(`❌ Update Version Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to update version')
    );
  }
};

/**
 * Check for Update
 * GET /api/version/check/:currentVersionCode
 */
exports.checkForUpdate = async (req, res, next) => {
  try {
    const { currentVersionCode } = req.params;

    const latestVersion = await Version.getLatestVersion();

    if (!latestVersion) {
      return res.status(200).json({
        success: true,
        data: {
          updateAvailable: false,
          forceUpdate: false,
        },
      });
    }

    const updateAvailable = latestVersion.versionCode > parseInt(currentVersionCode);
    const forceUpdate = updateAvailable && latestVersion.forceUpdate;

    return res.status(200).json({
      success: true,
      data: {
        updateAvailable,
        forceUpdate,
        currentVersion: latestVersion.version,
        downloadUrl: latestVersion.apkUrl,
        changelog: latestVersion.changelog,
      },
    });
  } catch (error) {
    logger.error(`❌ Check for Update Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to check for update',
    });
  }
};

/**
 * Increment Download Count
 * POST /api/version/:id/download
 */
exports.recordDownload = async (req, res, next) => {
  try {
    const { id } = req.params;

    await Version.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    return res.status(200).json(
      formatResponse(true, 'Download recorded')
    );
  } catch (error) {
    logger.error(`❌ Record Download Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to record download')
    );
  }
};
