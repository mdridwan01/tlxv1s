const mongoose = require('mongoose');

/**
 * Channel Model
 * Core IPTV channel model with multiple sources and metadata
 */
const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Channel name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Movies',
        'Sports',
        'News',
        'Entertainment',
        'Documentary',
        'Kids',
        'Music',
        'Religious',
        'Other',
      ],
    },
    country: {
      type: String,
      default: 'Global',
    },
    description: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: 'https://via.placeholder.com/300x200?text=No+Image',
    },
    sources: [
      {
        _id: false,
        name: {
          type: String,
          default: 'Primary',
        },
        url: {
          type: String,
          required: true,
          validate: {
            validator: (v) => /^https?:\/\/.+/.test(v),
            message: 'Invalid URL format',
          },
        },
        priority: {
          type: Number,
          default: 1,
          min: 1,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        backup: {
          type: String,
          default: null,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    epg: {
      type: String,
      default: null, // EPG URL for program guide
    },
    tags: [String],
    isSponsored: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for search
channelSchema.index({ name: 'text', description: 'text' });
channelSchema.index({ category: 1, country: 1 });

// Auto-generate slug from name
channelSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  next();
});

// Sort sources by priority before saving
channelSchema.pre('save', function (next) {
  if (this.sources) {
    this.sources.sort((a, b) => a.priority - b.priority);
  }
  next();
});

module.exports = mongoose.model('Channel', channelSchema);
