const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 500
  },
  technologies: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    alt: String
  }],
  liveUrls: [{
    type: String,
    trim: true
  }],
  githubUrls: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    enum: ['web', 'mobile', 'desktop', 'other'],
    default: 'web'
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'planned'],
    default: 'completed'
  },
  visible: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
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
  }],
  projectFiles: [{
    url: String,
    publicId: String,
    originalName: String,
    mimeType: String,
    size: Number,
    description: String,
    visible: {
      type: Boolean,
      default: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  linkedCertificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);


