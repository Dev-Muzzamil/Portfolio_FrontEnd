/**
 * Portfolio Backend Server
 * Clean MVC Architecture with DRY and SOLID Principles
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cloudinary = require('cloudinary').v2;
const colors = require('colors');

// Import configurations
const connectDB = require('./config/database');
const { initializeRedis } = require('./config/redis');

// Import middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const { authenticate } = require('./middleware/auth/roleAuth');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin/optimized');
const publicRoutes = require('./routes/public/optimized');

// Import individual admin routes
const projectRoutes = require('./routes/admin/projects');
const certificateRoutes = require('./routes/admin/certificates');
const skillRoutes = require('./routes/admin/skills');
const aboutRoutes = require('./routes/admin/about');
const configurationRoutes = require('./routes/admin/configuration');

// Import services
const { initializeScheduling } = require('./services/content/SchedulingService');

// Connect to MongoDB
connectDB();

// Initialize Redis
initializeRedis();

const app = express();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});
console.log('☁️ Cloudinary configured'.cyan.bold);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.github.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Rate limit exceeded. Try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/v1/health' || 
           req.path.includes('/upload') ||
           req.path.includes('/actions');
  }
});

app.use(limiter);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);

// Individual admin routes (for backward compatibility)
app.use('/api/v1/admin/projects', projectRoutes);
app.use('/api/v1/admin/certificates', certificateRoutes);
app.use('/api/v1/admin/skills', skillRoutes);
app.use('/api/v1/admin/about', aboutRoutes);
app.use('/api/v1/admin/configuration', configurationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
  console.log(`📊 Health check: http://localhost:${PORT}/api/v1/health`.cyan);
  
  // Initialize scheduled tasks
  initializeScheduling();
  console.log('⏰ Scheduled tasks initialized'.green);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = app;
