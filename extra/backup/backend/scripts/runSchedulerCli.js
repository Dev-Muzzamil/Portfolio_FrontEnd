#!/usr/bin/env node

/**
 * CLI wrapper for the robust scheduler
 * This ensures the scheduler runs in a separate process and exits cleanly
 */

const RobustScheduler = require('./robustScheduler');

// Set process title for easier identification
process.title = 'portfolio-screenshot-scheduler';

// Handle command line arguments
const args = process.argv.slice(2);
const isTestRun = args.includes('--test');
const isVerbose = args.includes('--verbose');

if (isVerbose) {
  console.log('🔍 Verbose mode enabled');
  process.env.DEBUG = 'true';
}

if (isTestRun) {
  console.log('🧪 Test run mode - will exit after completion');
}

console.log('🚀 Starting screenshot scheduler CLI...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🆔 Process ID: ${process.pid}`);

// Create and run scheduler
const scheduler = new RobustScheduler();

// Setup graceful shutdown
scheduler.setupGracefulShutdown();

// Run the scheduler
scheduler.runWithTimeout()
  .then(() => {
    console.log('✅ Scheduler completed successfully');
    if (isTestRun) {
      console.log('🧪 Test run completed, exiting...');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Scheduler failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });

// Additional safety timeout (10 minutes absolute max)
const absoluteTimeout = setTimeout(() => {
  console.error('💀 Absolute timeout reached - forcing exit');
  process.exit(1);
}, 10 * 60 * 1000);

// Clear timeout on normal exit
process.on('exit', () => {
  clearTimeout(absoluteTimeout);
});

// Handle any remaining promises
process.on('beforeExit', (code) => {
  console.log(`🏁 Process beforeExit with code: ${code}`);
  clearTimeout(absoluteTimeout);
});

// Log process events for debugging
if (isVerbose) {
  process.on('warning', (warning) => {
    console.warn('⚠️ Process warning:', warning);
  });
}