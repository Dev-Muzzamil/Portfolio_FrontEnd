const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  github: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  twitter: { type: String, default: '' },
  website: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' }
});

const contactInfoSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  address: { type: String, default: '' }
});

const siteInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  shortBio: { type: String, required: true },
  bio: { type: String, required: true },
  bioParagraphs: [{ type: String }], // Array of bio paragraphs
  tagline: { type: String, default: '' },
  website: { type: String, default: '' }
});

const brandingSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  icon: { type: String, default: '' }
});

const statsSchema = new mongoose.Schema({
  yearsExperience: { type: Number, default: 0 },
  projectsCount: { type: Number, default: 0 },
  technologiesCount: { type: Number, default: 0 },
  certificatesCount: { type: Number, default: 0 }
});

const seoSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  keywords: { type: String, default: '' },
  author: { type: String, default: '' },
  ogImage: { type: String, default: '' }
});

const themeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#3B82F6' },
  secondaryColor: { type: String, default: '#1E40AF' },
  accentColor: { type: String, default: '#F59E0B' },
  backgroundColor: { type: String, default: '#F9FAFB' },
  textColor: { type: String, default: '#111827' }
});

const configurationSchema = new mongoose.Schema({
  // Site Information
  siteInfo: { type: siteInfoSchema, required: true },
  
  // Branding
  branding: { type: brandingSchema, default: {} },
  
  // Contact Information
  contactInfo: { type: contactInfoSchema, required: true },
  
  // Social Links
  socialLinks: { type: socialLinksSchema, default: {} },
  
  // Statistics
  stats: { type: statsSchema, default: {} },
  
  // SEO Information
  seo: { type: seoSchema, default: {} },
  
  // Theme Configuration
  theme: { type: themeSchema, default: {} },
  
  // Profile Photo
  profilePhoto: {
    url: { type: String, default: '' },
    alt: { type: String, default: 'Profile Photo' }
  },
  
  // Site Settings
  settings: {
    showResume: { type: Boolean, default: true },
    showProjects: { type: Boolean, default: true },
    showSkills: { type: Boolean, default: true },
    showCertificates: { type: Boolean, default: true },
    showContact: { type: Boolean, default: true },
    showGitHub: { type: Boolean, default: true },
    enableContactForm: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'Site is under maintenance. Please check back later.' }
  },
  
  // Navigation
  navigation: [{
    name: { type: String, required: true },
    href: { type: String, required: true },
    visible: { type: Boolean, default: true }
  }],
  
  // Footer
  footer: {
    brandName: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
    showAdminLink: { type: Boolean, default: true }
  },
  
  // Meta Information
  isActive: { type: Boolean, default: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure only one configuration document exists
configurationSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

module.exports = mongoose.model('Configuration', configurationSchema);
