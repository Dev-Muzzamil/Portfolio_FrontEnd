const mongoose = require('mongoose');
const baseContentSchema = require('./BaseContent');

/**
 * Certificate model extending BaseContent
 * Represents professional certificates and achievements
 */
const certificateSchema = new mongoose.Schema({
  // Certificate-specific fields
  issuer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.issueDate;
      },
      message: 'Expiry date must be after issue date'
    }
  },
  credentialId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  credentialUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Credential URL must be a valid HTTP/HTTPS URL'
    }
  },
  
  // Certificate Type
  certificateType: {
    type: String,
    enum: ['course', 'workshop', 'certification', 'award', 'degree', 'diploma', 'badge', 'other'],
    default: 'certification'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert', 'professional'],
    default: 'intermediate'
  },
  
  // Skills and Competencies
  skills: [{
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    verified: {
      type: Boolean,
      default: true
    }
  }],
  
  // Files and Media
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
    thumbnailUrl: String,
    thumbnailPublicId: String,
    category: {
      type: String,
      enum: ['certificate', 'transcript', 'badge', 'verification', 'other'],
      default: 'certificate'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Institution/Education Context
  completedAtInstitution: {
    type: String,
    trim: true
  },
  educationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Education'
  },
  
  // Verification
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: String,
    verificationMethod: {
      type: String,
      enum: ['manual', 'api', 'email', 'url'],
      default: 'manual'
    },
    verificationNotes: String
  },
  
  // Reports and Documentation
  reports: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
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
      platform: {
        type: String,
        enum: ['linkedin', 'github', 'medium', 'dev', 'hashnode', 'other'],
        default: 'other'
      },
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
  
  // Competencies and Learning Outcomes
  competencies: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    level: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    }
  }],
  
  // Validity and Renewal
  validity: {
    isPermanent: {
      type: Boolean,
      default: false
    },
    renewalRequired: {
      type: Boolean,
      default: false
    },
    renewalPeriod: {
      type: Number, // in months
      default: 12
    },
    lastRenewed: Date,
    nextRenewal: Date
  },
  
  // Metrics
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    lastViewed: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add base content fields
certificateSchema.add(baseContentSchema);

// Additional indexes
certificateSchema.index({ issuer: 1, status: 1 });
certificateSchema.index({ issueDate: -1 });
certificateSchema.index({ expiryDate: 1 });
certificateSchema.index({ certificateType: 1, status: 1 });
certificateSchema.index({ level: 1 });
certificateSchema.index({ 'skills.name': 1 });
certificateSchema.index({ credentialId: 1 });
certificateSchema.index({ educationId: 1 });
certificateSchema.index({ 'verification.isVerified': 1 });

// Virtual for primary file
certificateSchema.virtual('primaryFile').get(function() {
  const primaryFile = this.files.find(file => file.isPrimary);
  return primaryFile || this.files[0] || null;
});

// Virtual for certificate validity status
certificateSchema.virtual('isValid').get(function() {
  if (this.validity.isPermanent) return true;
  if (!this.expiryDate) return true;
  return new Date() <= this.expiryDate;
});

// Virtual for certificate age in days
certificateSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.issueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until expiry
certificateSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diffTime = this.expiryDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for all skill names
certificateSchema.virtual('skillNames').get(function() {
  return this.skills.map(skill => skill.name);
});

// Pre-save middleware to calculate next renewal date
certificateSchema.pre('save', function(next) {
  if (this.validity.renewalRequired && this.validity.renewalPeriod) {
    const lastRenewal = this.validity.lastRenewed || this.issueDate;
    this.validity.nextRenewal = new Date(lastRenewal);
    this.validity.nextRenewal.setMonth(this.validity.nextRenewal.getMonth() + this.validity.renewalPeriod);
  }
  next();
});

// Instance method to add skill
certificateSchema.methods.addSkill = function(skillData) {
  const existingSkill = this.skills.find(skill => 
    skill.name.toLowerCase() === skillData.name.toLowerCase()
  );
  
  if (!existingSkill) {
    this.skills.push(skillData);
  } else {
    Object.assign(existingSkill, skillData);
  }
  
  return this.save();
};

// Instance method to remove skill
certificateSchema.methods.removeSkill = function(skillName) {
  this.skills = this.skills.filter(skill => 
    skill.name.toLowerCase() !== skillName.toLowerCase()
  );
  return this.save();
};

// Instance method to add file
certificateSchema.methods.addFile = function(fileData) {
  this.files.push(fileData);
  return this.save();
};

// Instance method to set primary file
certificateSchema.methods.setPrimaryFile = function(fileId) {
  this.files.forEach(file => file.isPrimary = false);
  const file = this.files.id(fileId);
  if (file) {
    file.isPrimary = true;
  }
  return this.save();
};

// Instance method to add report
certificateSchema.methods.addReport = function(reportData) {
  this.reports.push(reportData);
  return this.save();
};

// Instance method to add competency
certificateSchema.methods.addCompetency = function(competencyData) {
  this.competencies.push(competencyData);
  return this.save();
};

// Instance method to verify certificate
certificateSchema.methods.verify = function(verifiedBy, method = 'manual', notes = '') {
  this.verification.isVerified = true;
  this.verification.verifiedAt = new Date();
  this.verification.verifiedBy = verifiedBy;
  this.verification.verificationMethod = method;
  this.verification.verificationNotes = notes;
  return this.save();
};

// Instance method to renew certificate
certificateSchema.methods.renew = function() {
  if (this.validity.renewalRequired) {
    this.validity.lastRenewed = new Date();
  }
  return this.save();
};

// Static method to find certificates by issuer
certificateSchema.statics.findByIssuer = function(issuer) {
  return this.find({
    issuer: { $regex: issuer, $options: 'i' },
    status: 'published',
    visibility: 'public',
    deletedAt: { $exists: false }
  });
};

// Static method to find certificates by skill
certificateSchema.statics.findBySkill = function(skillName) {
  return this.find({
    'skills.name': { $regex: skillName, $options: 'i' },
    status: 'published',
    visibility: 'public',
    deletedAt: { $exists: false }
  });
};

// Static method to find expiring certificates
certificateSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: 'published',
    visibility: 'public',
    deletedAt: { $exists: false }
  });
};

// Static method to find verified certificates
certificateSchema.statics.findVerified = function() {
  return this.find({
    'verification.isVerified': true,
    status: 'published',
    visibility: 'public',
    deletedAt: { $exists: false }
  });
};

module.exports = mongoose.model('Certificate', certificateSchema);
