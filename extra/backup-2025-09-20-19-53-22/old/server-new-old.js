const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const redisClient = require('./config/redis');
const securityMiddleware = require('./middleware/security/security');
const { ROLES } = require('./constants/roles');

// Import routes
const authRoutes = require('./routes/auth');
const adminProjectRoutes = require('./routes/admin/projects');
const publicContentRoutes = require('./routes/public/content');

const app = express();

// Trust proxy for rate limiting and security
app.set('trust proxy', 1);

// Security middleware
app.use(securityMiddleware.helmet());
app.use(securityMiddleware.cors());
app.use(securityMiddleware.mongoSanitize());
app.use(securityMiddleware.xssClean());
app.use(securityMiddleware.hpp());
app.use(securityMiddleware.securityHeaders());

// Rate limiting
app.use(securityMiddleware.rateLimit());

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbState = require('mongoose').connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const redisStatus = redisClient.isConnected ? 'connected' : 'disconnected';

    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus[dbState] || 'unknown',
        name: require('mongoose').connection.name || 'unknown',
        host: require('mongoose').connection.host || 'unknown'
      },
      cache: {
        status: redisStatus
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
console.log('🔧 Setting up API routes...');

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// Admin routes (protected)
app.use('/api/v1/admin/projects', adminProjectRoutes);
// Add more admin routes here...

// Public routes
app.use('/api/v1/public', publicContentRoutes);

// Legacy routes for backward compatibility
app.use('/api/projects', require('./routes/projects'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/about', require('./routes/about'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/github', require('./routes/github'));
app.use('/api/configuration', require('./routes/configuration'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/pdf', require('./routes/pdfConversion'));

console.log('✅ API routes configured');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log error for monitoring
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to send this to a logging service
    console.error('Production error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.originalUrl
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    await redisClient.disconnect();
    await require('mongoose').connection.close();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    await redisClient.disconnect();
    await require('mongoose').connection.close();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you should exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Initialize application
const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await redisClient.connect();
    
    // Start server
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Redis Status: ${redisClient.isConnected ? 'Connected' : 'Disconnected'}`);
    });

    // Set server timeout
    server.timeout = 30000; // 30 seconds

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
