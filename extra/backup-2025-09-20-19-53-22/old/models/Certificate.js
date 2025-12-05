const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  issuer: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  credentialId: {
    type: String,
    trim: true
  },
  credentialUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    alt: String
  },
  files: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: Number,
    isPrimary: {
      type: Boolean,
      default: false
    },
    thumbnailUrl: String, // For PDF thumbnails
    thumbnailPublicId: String // Cloudinary public ID for thumbnail
  }],
  skills: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['course', 'workshop', 'certification', 'award', 'other'],
    default: 'certification'
  },
  visible: {
    type: Boolean,
    default: true
  },
  linkedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  completedAtInstitution: {
    type: String,
    trim: true
  },
  reports: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['file', 'link'],
      required: true
    },
    file: {
      url: String,
      publicId: String,
      originalName: String,
      mimeType: String,
      size: Number
    },
    link: {
      url: String,
      platform: String, // e.g., 'linkedin', 'github', 'medium', 'other'
      title: String
    },
    visible: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);


