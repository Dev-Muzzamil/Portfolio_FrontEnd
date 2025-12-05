const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Bio must contain at least one paragraph'
    }
  },
  shortBio: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Short bio must contain at least one paragraph'
    },
    maxlength: 200
  },
  photo: {
    url: String,
    publicId: String
  },
  resumes: [{
    url: String,
    publicId: String,
    originalName: String,
    mimeType: String,
    size: Number,
    title: String,
    documentType: { 
      type: String, 
      enum: ['resume', 'cv'], 
      default: 'resume' 
    },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  activeResumeId: String,
  location: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  socialLinks: {
    github: String,
    linkedin: String,
    x: String, // X (formerly Twitter)
    instagram: String,
    facebook: String,
    youtube: String,
    tiktok: String,
    discord: String,
    telegram: String,
    whatsapp: String,
    snapchat: String,
    reddit: String,
    behance: String,
    dribbble: String,
    pinterest: String,
    medium: String,
    dev: String,
    stackoverflow: String,
    website: String,
    custom: [{
      name: String,
      url: String
    }]
  },
  experience: [{
    company: String,
    position: String,
    duration: String,
    description: String,
    current: { type: Boolean, default: false }
  }],
  education: [{
    institution: String,
    degree: String,
    field: String,
    duration: String,
    description: String,
    linkedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    linkedCertificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
    linkedSkills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }]
  }],
  documentType: {
    type: String,
    enum: ['resume', 'cv', 'both'],
    default: 'resume'
  },
  skillOverrides: [{
    skillName: { type: String, required: true },
    source: { type: String, required: true }, // 'project', 'certificate', 'manual'
    sourceId: { type: String, required: true }, // ID of the source project/certificate
    action: { 
      type: String, 
      enum: ['hide', 'show', 'delete'], 
      required: true 
    },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('About', aboutSchema);


