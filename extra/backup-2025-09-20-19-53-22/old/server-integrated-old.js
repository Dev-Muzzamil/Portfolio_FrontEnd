const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Import new architecture components
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
const security = require('./middleware/security/security');
app.use(security.helmet());
app.use(security.mongoSanitize());
app.use(security.xssClean());
app.use(security.hpp());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use(security.rateLimit());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    architecture: 'New Optimized Architecture'
  });
});

// ========================================
// NEW ARCHITECTURE ROUTES (v1)
// ========================================

// Public API routes (v1)
const publicContentRoutes = require('./routes/public/content');
app.use('/api/v1/public', publicContentRoutes);

// Admin API routes (v1)
const adminProjectRoutes = require('./routes/admin/projects');
const adminCertificateRoutes = require('./routes/admin/certificates');
const adminSkillRoutes = require('./routes/admin/skills');
const adminAboutRoutes = require('./routes/admin/about');
const adminConfigurationRoutes = require('./routes/admin/configuration');

app.use('/api/v1/admin/projects', adminProjectRoutes);
app.use('/api/v1/admin/certificates', adminCertificateRoutes);
app.use('/api/v1/admin/skills', adminSkillRoutes);
app.use('/api/v1/admin/about', adminAboutRoutes);
app.use('/api/v1/admin/configuration', adminConfigurationRoutes);

// Auth routes (v1)
const authRoutes = require('./routes/auth');
app.use('/api/v1/auth', authRoutes);

// ========================================
// BACKWARD COMPATIBILITY ROUTES (Legacy)
// ========================================

// Legacy routes for backward compatibility
const legacyProjectRoutes = require('./routes/projects');
const legacyCertificateRoutes = require('./routes/certificates');
const legacySkillRoutes = require('./routes/skills');
const legacyAboutRoutes = require('./routes/about');
const legacyConfigurationRoutes = require('./routes/configuration');
const legacyContactRoutes = require('./routes/contact');
const legacyUploadRoutes = require('./routes/upload');
const legacyPdfRoutes = require('./routes/pdfConversion');

// Legacy API routes (for backward compatibility)
app.use('/api/projects', legacyProjectRoutes);
app.use('/api/certificates', legacyCertificateRoutes);
app.use('/api/skills', legacySkillRoutes);
app.use('/api/about', legacyAboutRoutes);
app.use('/api/configuration', legacyConfigurationRoutes);
app.use('/api/contact', legacyContactRoutes);
app.use('/api/upload', legacyUploadRoutes);
app.use('/api/pdf', legacyPdfRoutes);

// Legacy auth routes
app.use('/api/auth', authRoutes);

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: {
      v1: {
        public: '/api/v1/public/*',
        admin: '/api/v1/admin/*',
        auth: '/api/v1/auth/*'
      },
      legacy: '/api/*'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// ========================================
// DATABASE CONNECTION
// ========================================

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (if available)
    try {
      await connectRedis();
      console.log('✅ Redis connected successfully');
    } catch (redisError) {
      console.warn('⚠️ Redis connection failed, continuing without cache:', redisError.message);
    }
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
📊 Architecture: New Optimized Backend
🔗 API Version: v1 (with legacy support)
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📝 Available routes:
   • New API: /api/v1/public/*, /api/v1/admin/*, /api/v1/auth/*
   • Legacy API: /api/* (for backward compatibility)
   • Health check: /api/health
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
