const Channel = require('../models/Channel');
const { setCache, getCache, deleteCache } = require('../config/redis');
const { formatResponse, paginate } = require('../utils/helpers');
const logger = require('../utils/logger');

const CHANNEL_CACHE_KEY = 'channels:all';
const CHANNEL_CACHE_TTL = 3600; // 1 hour

/**
 * Get All Channels
 * GET /api/channels
 */
exports.getAllChannels = async (req, res, next) => {
  try {
    const { page, limit, category, country, search } = req.query;
    const { skip, limit: limitNum } = paginate(page, limit);

    // Try to get from cache
    const cacheKey = `${CHANNEL_CACHE_KEY}:${page || 1}:${limit || 10}:${category || ''}:${country || ''}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(
        formatResponse(true, 'Channels fetched from cache', cachedData)
      );
    }

    // Build query
    let query = Channel.find({ status: 'active' });

    if (category) {
      query = query.where('category', category);
    }

    if (country) {
      query = query.where('country', country);
    }

    if (search) {
      query = query.where('$text', { $search: search });
    }

    // Get total count
    const total = await Channel.countDocuments(query);

    // Execute query with pagination
    const channels = await query
      .select('-sources.backup')
      .skip(skip)
      .limit(limitNum)
      .sort({ priority: 1, views: -1 })
      .lean();

    const result = {
      channels,
      pagination: {
        page: parseInt(page) || 1,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache result
    await setCache(cacheKey, result, CHANNEL_CACHE_TTL);

    return res.status(200).json(
      formatResponse(true, 'Channels fetched successfully', result)
    );
  } catch (error) {
    logger.error(`❌ Get Channels Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch channels')
    );
  }
};

/**
 * Get Single Channel
 * GET /api/channels/:id
 */
exports.getChannel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json(
        formatResponse(false, 'Channel not found')
      );
    }

    // Increment views
    channel.views += 1;
    await channel.save();

    return res.status(200).json(
      formatResponse(true, 'Channel fetched successfully', {
        channel,
      })
    );
  } catch (error) {
    logger.error(`❌ Get Channel Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to fetch channel')
    );
  }
};

/**
 * Create Channel
 * POST /api/channels
 */
exports.createChannel = async (req, res, next) => {
  try {
    const { name, category, country, description, sources, thumbnail } = req.body;

    // Validate required fields
    if (!name || !category || !sources || sources.length === 0) {
      return res.status(400).json(
        formatResponse(false, 'Name, category, and at least one source are required')
      );
    }

    // Determine new channel ordering priority
    const totalChannels = await Channel.countDocuments();

    // Create channel
    const channel = await Channel.create({
      name,
      category,
      country: country || 'Global',
      description: description || '',
      sources,
      thumbnail: thumbnail || 'https://via.placeholder.com/300x200?text=No+Image',
      priority: totalChannels + 1,
    });

    logger.info(`✅ Channel created: ${name}`);

    // Invalidate cache
    await deleteCache(CHANNEL_CACHE_KEY);

    return res.status(201).json(
      formatResponse(true, 'Channel created successfully', {
        channel,
      })
    );
  } catch (error) {
    logger.error(`❌ Create Channel Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to create channel', null, error.message)
    );
  }
};

/**
 * Update Channel
 * PUT /api/channels/:id
 */
exports.updateChannel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const channel = await Channel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!channel) {
      return res.status(404).json(
        formatResponse(false, 'Channel not found')
      );
    }

    logger.info(`✅ Channel updated: ${channel.name}`);

    // Invalidate cache
    await deleteCache(CHANNEL_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Channel updated successfully', {
        channel,
      })
    );
  } catch (error) {
    logger.error(`❌ Update Channel Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to update channel', null, error.message)
    );
  }
};

/**
 * Delete Channel
 * DELETE /api/channels/:id
 */
exports.deleteChannel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const channel = await Channel.findByIdAndDelete(id);
    if (!channel) {
      return res.status(404).json(
        formatResponse(false, 'Channel not found')
      );
    }

    logger.info(`✅ Channel deleted: ${channel.name}`);

    // Invalidate cache
    await deleteCache(CHANNEL_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Channel deleted successfully')
    );
  } catch (error) {
    logger.error(`❌ Delete Channel Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to delete channel')
    );
  }
};

/**
 * Bulk Update Channels (Reorder)
 * POST /api/channels/bulk/update
 */
exports.bulkUpdateChannels = async (req, res, next) => {
  try {
    const { updates } = req.body; // Array of { id, priority }

    if (!Array.isArray(updates)) {
      return res.status(400).json(
        formatResponse(false, 'Updates must be an array')
      );
    }

    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { priority: item.priority } },
      },
    }));

    await Channel.bulkWrite(bulkOps);

    logger.info(`✅ Bulk updated ${updates.length} channels`);

    // Invalidate cache
    await deleteCache(CHANNEL_CACHE_KEY);

    return res.status(200).json(
      formatResponse(true, 'Channels updated successfully')
    );
  } catch (error) {
    logger.error(`❌ Bulk Update Channels Error: ${error.message}`);
    return res.status(500).json(
      formatResponse(false, 'Failed to bulk update channels')
    );
  }
};
