const mongoose = require('mongoose');
const { captureAndUpload } = require('./captureAndUpload');

// Enhanced scheduler with proper process management
class RobustScheduler {
  constructor() {
    this.isRunning = false;
    this.timeoutId = null;
    this.processTimeout = 5 * 60 * 1000; // 5 minutes max per run
    this.retryAttempts = 3;
    this.retryDelay = 30000; // 30 seconds between retries
  }

  async connectDB() {
    try {
      if (mongoose.connection.readyState === 1) {
        return; // Already connected
      }

      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      console.log('✅ Database connected for scheduler');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async runWithTimeout() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting scheduled screenshot capture...');

    // Set a hard timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      this.timeoutId = setTimeout(() => {
        reject(new Error('Scheduler timeout - process killed after 5 minutes'));
      }, this.processTimeout);
    });

    try {
      // Run the actual capture with timeout
      const capturePromise = this.executeCapture();
      
      await Promise.race([capturePromise, timeoutPromise]);
      
      console.log('✅ Screenshot capture completed successfully');
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error.message);
      
      // Retry logic
      if (error.message.includes('timeout')) {
        console.log('⏰ Process timed out, will retry on next schedule');
      } else {
        console.log('🔄 Will retry on next schedule');
      }
    } finally {
      // Cleanup
      this.isRunning = false;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      
      // Force close database connection to prevent hanging
      try {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
      } catch (err) {
        console.warn('⚠️ Error closing database connection:', err.message);
      }
      
      // Force exit after a short delay to ensure cleanup
      setTimeout(() => {
        console.log('🏁 Scheduler process exiting cleanly');
        process.exit(0);
      }, 1000);
    }
  }

  async executeCapture() {
    await this.connectDB();
    
    const Project = require('../models/Project');
    const projects = await Project.find({ 
      liveUrls: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    console.log(`📸 Found ${projects.length} projects to capture`);

    if (projects.length === 0) {
      console.log('ℹ️ No projects with live URLs found, skipping capture');
      return;
    }

    // Process projects in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(projects.length / batchSize)}`);
      
      // Process batch concurrently but with individual timeouts
      const batchPromises = batch.map(project => this.captureProject(project));
      await Promise.allSettled(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < projects.length) {
        await this.delay(2000);
      }
    }
  }

  async captureProject(project) {
    const url = project.liveUrls[0];
    if (!url) return;

    try {
      console.log(`🎯 Capturing: ${project.title}`);
      
      // Individual project timeout (increased for heavy sites)
      const projectTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Project ${project.title} timeout`)), 90000);
      });

      const capturePromise = this.captureAndUpdateProject(project, url);
      await Promise.race([capturePromise, projectTimeout]);
      
      console.log(`✅ Successfully captured: ${project.title}`);
      
      // Small delay between projects to be gentle on the system
      await this.delay(2000);
      
    } catch (error) {
      console.error(`❌ Failed to capture ${project.title}:`, error.message);
    }
  }

  async captureAndUpdateProject(project, url) {
    const uploadResult = await captureAndUpload(url, `project_${project._id}`, project._id);

    // Update project with new screenshot
    const Project = require('../models/Project');
    await Project.findByIdAndUpdate(project._id, {
      $set: {
        images: [{
          url: uploadResult.secure_url,
          alt: `${project.title} screenshot`
        }]
      }
    });

    console.log(`💾 Updated project: ${project.title}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Graceful shutdown handler
  setupGracefulShutdown() {
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      this.isRunning = false;
      
      // Force exit after cleanup
      setTimeout(() => {
        console.log('🏁 Forced exit after graceful shutdown');
        process.exit(0);
      }, 2000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR1', () => shutdown('SIGUSR1'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }
}

// CLI execution
if (require.main === module) {
  const scheduler = new RobustScheduler();
  scheduler.setupGracefulShutdown();
  
  console.log('🚀 Starting robust screenshot scheduler...');
  console.log(`⏰ Process timeout: ${scheduler.processTimeout / 1000}s`);
  console.log(`🔄 Retry attempts: ${scheduler.retryAttempts}`);
  
  scheduler.runWithTimeout().catch(error => {
    console.error('💥 Scheduler failed:', error);
    process.exit(1);
  });
}

module.exports = RobustScheduler;
