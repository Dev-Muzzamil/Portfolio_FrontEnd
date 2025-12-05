const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Trust proxy for rate limiting (important for production deployments)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Rate limit exceeded. Try again in 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for health checks and file uploads
  skip: (req) => {
    return req.path === '/api/health' || 
           req.path.includes('/with-files') || 
           req.path.includes('/upload');
  }
});

// Separate rate limiter for file uploads (more lenient)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Allow more file uploads
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: 'File upload rate limit exceeded. Try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus[dbState] || 'unknown',
      name: mongoose.connection.name || 'unknown',
      host: mongoose.connection.host || 'unknown'
    }
  });
});

// Development helper endpoint to clear rate limits
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/clear-rate-limit', (req, res) => {
    // This is a simple way to "reset" rate limits by restarting the limiter
    // In a real production app, you'd want to use Redis or similar
    res.json({ message: 'Rate limit cleared for development. Note: This only works for the current process.' });
  });
}

// Routes
console.log('🔧 Setting up API routes...');
app.use('/api/auth', require('./routes/auth'));
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
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
const connectDB = async (retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
    console.log(`🔄 Connecting to MongoDB... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    // Start server only after successful DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
    });
    // After DB connect, start robust screenshot scheduler
    try {
      const cron = require('node-cron');
      const { spawn } = require('child_process');
      const path = require('path');
      const cliPath = path.join(__dirname, 'scripts', 'runSchedulerCli.js');
      
      // Reduced timeout to prevent hanging
      const killTimeout = parseInt(process.env.RUN_KILL_TIMEOUT_MS || String(5 * 60 * 1000), 10); // 5 minutes max
      const maxRetries = 3;
      let retryCount = 0;

      function spawnSchedulerRun(reason) {
        if (retryCount >= maxRetries) {
          console.error(`❌ Max retries (${maxRetries}) reached for scheduler, skipping this run`);
          retryCount = 0; // Reset for next scheduled run
          return;
        }

        console.log(`🚀 Spawning robust scheduler run (${reason}) - Attempt ${retryCount + 1}/${maxRetries}`);
        
        const child = spawn(process.execPath, [cliPath], { 
          stdio: 'pipe', // Use pipe instead of inherit for better control
          env: { ...process.env, NODE_ENV: 'production' },
          detached: false // Don't detach to ensure proper cleanup
        });

        let hasExited = false;
        let output = '';

        // Collect output for debugging
        child.stdout.on('data', (data) => {
          const message = data.toString();
          output += message;
          console.log(`[Scheduler] ${message.trim()}`);
        });

        child.stderr.on('data', (data) => {
          const message = data.toString();
          output += message;
          console.error(`[Scheduler Error] ${message.trim()}`);
        });

        // Hard timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!hasExited) {
            console.error(`⏰ Scheduler timeout after ${killTimeout}ms - killing process`);
            try {
              child.kill('SIGKILL');
            } catch (err) {
              console.error('Error killing scheduler child:', err);
            }
          }
        }, killTimeout);

        child.on('exit', (code, signal) => {
          hasExited = true;
          clearTimeout(timeout);
          
          console.log(`✅ Scheduler child exited with code=${code} signal=${signal}`);
          
          if (code === 0) {
            console.log('🎉 Scheduler completed successfully');
            retryCount = 0; // Reset on success
          } else {
            retryCount++;
            console.error(`❌ Scheduler failed with code ${code}, retry count: ${retryCount}`);
            
            // Retry after a delay if not at max retries
            if (retryCount < maxRetries) {
              console.log(`🔄 Retrying scheduler in 30 seconds...`);
              setTimeout(() => {
                spawnSchedulerRun(`${reason}-retry-${retryCount}`);
              }, 30000);
            }
          }
        });

        child.on('error', (err) => {
          hasExited = true;
          clearTimeout(timeout);
          retryCount++;
          console.error('💥 Scheduler child error:', err.message);
          
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying scheduler in 30 seconds due to error...`);
            setTimeout(() => {
              spawnSchedulerRun(`${reason}-error-retry-${retryCount}`);
            }, 30000);
          }
        });

        // Monitor for hanging processes
        const hangCheck = setInterval(() => {
          if (hasExited) {
            clearInterval(hangCheck);
            return;
          }
          
          // Check if process is still alive but not producing output
          if (child.killed || child.exitCode !== null) {
            clearInterval(hangCheck);
            return;
          }
        }, 30000); // Check every 30 seconds
      }

      // Initial run (unless disabled)
      if (process.env.RUN_SCHEDULER_ON_STARTUP !== 'false') {
        console.log('🚀 Starting initial screenshot capture...');
        spawnSchedulerRun('initial-startup');
      }

      // Schedule every 12 hours with better error handling
      cron.schedule('0 */12 * * *', () => {
        console.log('⏰ Cron triggered: starting scheduled screenshot capture');
        retryCount = 0; // Reset retry count for scheduled runs
        spawnSchedulerRun('cron-12h');
      });

      // Additional safety schedule every 6 hours as backup
      cron.schedule('0 */6 * * *', () => {
        console.log('⏰ Backup cron triggered: starting screenshot capture');
        retryCount = 0;
        spawnSchedulerRun('cron-6h-backup');
      });

      console.log('✅ Robust screenshot scheduler configured successfully');
      console.log('📅 Scheduled runs: Every 12 hours (primary), Every 6 hours (backup)');
      console.log(`⏱️ Process timeout: ${killTimeout / 1000}s`);
      console.log(`🔄 Max retries: ${maxRetries}`);
      
    } catch (err) {
      console.error('❌ Failed to configure screenshot scheduler:', err.message);
      console.error('Stack trace:', err.stack);
    }

    // Optional: run a one-off test after TEST_SCHEDULER_MINUTES (useful to verify scheduling)
    const testMinutes = parseInt(process.env.TEST_SCHEDULER_MINUTES || '0', 10);
    if (testMinutes > 0) {
      const delayMs = Math.max(60000, testMinutes * 60 * 1000); // at least 1 minute
      console.log(`Scheduling one-off test run in ${testMinutes} minute(s) (delay ${delayMs}ms)`);
      setTimeout(() => {
        (async () => {
          try {
            console.log('Running one-off test scheduled capture');
            await runScheduledCapture();
            console.log('One-off test scheduled capture finished');
          } catch (err) {
            console.error('One-off test scheduled capture failed', err);
          }
        })();
      }, delayMs);
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Check your MongoDB username and password in the connection string');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('💡 Check your internet connection and MongoDB Atlas cluster URL');
    } else if (error.message.includes('connection timed out')) {
      console.log('💡 MongoDB Atlas might be paused or IP whitelist needs updating');
    }
    
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check MongoDB Atlas dashboard - ensure cluster is running');
    console.log('2. Verify IP whitelist includes your current IP (0.0.0.0/0 for testing)');
    console.log('3. Check network connectivity and firewall settings');
    console.log('4. Verify connection string credentials');
    
    // Retry connection if under max retries
    if (retryCount < maxRetries) {
      console.log(`⏳ Retrying connection in 5 seconds... (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => connectDB(retryCount + 1), 5000);
    } else {
      console.log('❌ Max retry attempts reached. Please check your MongoDB Atlas configuration.');
      process.exit(1);
    }
  }
};

connectDB();


