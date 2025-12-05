const puppeteer = require('puppeteer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function backupScreenshots(projectId) {
  try {
    console.log(`💾 Creating backup for project: ${projectId}`);
    
    // List all resources in the project folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `project_${projectId}/`,
      max_results: 100
    });

    if (result.resources && result.resources.length > 0) {
      console.log(`📸 Found ${result.resources.length} screenshots to backup`);
      
      // Backup each screenshot to Cloudinary backup folder
      const backupPromises = result.resources.map(async (resource, index) => {
        try {
          const timestamp = new Date(resource.created_at).toISOString().replace(/[:.]/g, '-');
          const backupPublicId = `backup_screenshots/project_${projectId}/screenshot_${timestamp}_${index + 1}`;
          
          // Copy the image to backup folder in Cloudinary
          const backupResult = await cloudinary.uploader.upload(resource.secure_url, {
            public_id: backupPublicId,
            folder: 'backup_screenshots',
            resource_type: 'image',
            quality: 'auto:best',
            overwrite: false
          });
          
          // Create metadata object
          const metadata = {
            originalPublicId: resource.public_id,
            originalUrl: resource.secure_url,
            backupPublicId: backupResult.public_id,
            backupUrl: backupResult.secure_url,
            createdAt: resource.created_at,
            size: resource.bytes,
            format: resource.format,
            width: resource.width,
            height: resource.height,
            backedUpAt: new Date().toISOString()
          };
          
          console.log(`✅ Backed up: ${backupResult.public_id}`);
          return { backupResult, metadata };
        } catch (error) {
          console.error(`❌ Error backing up screenshot ${index + 1}:`, error.message);
          return null;
        }
      });
      
      const backupResults = await Promise.all(backupPromises);
      const successfulBackups = backupResults.filter(result => result !== null);
      
      console.log(`✅ Successfully backed up ${successfulBackups.length} screenshots to Cloudinary`);
      return successfulBackups;
    } else {
      console.log(`ℹ️ No screenshots found to backup for project: ${projectId}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error backing up screenshots for project ${projectId}:`, error.message);
    return [];
  }
}

async function shouldCaptureNewScreenshot(projectId) {
  try {
    console.log(`🔍 Checking screenshot age for project: ${projectId}`);
    
    // List all resources in the project folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `project_${projectId}/`,
      max_results: 100
    });

    if (!result.resources || result.resources.length === 0) {
      console.log(`📸 No existing screenshots found for project: ${projectId}, will capture new ones`);
      return true;
    }

    // Find the most recent screenshot
    const mostRecentScreenshot = result.resources.reduce((latest, current) => {
      const latestDate = new Date(latest.created_at);
      const currentDate = new Date(current.created_at);
      return currentDate > latestDate ? current : latest;
    });

    const screenshotAge = Date.now() - new Date(mostRecentScreenshot.created_at).getTime();
    const twelveHoursInMs = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

    console.log(`📅 Most recent screenshot created: ${mostRecentScreenshot.created_at}`);
    console.log(`⏰ Screenshot age: ${Math.round(screenshotAge / (60 * 60 * 1000))} hours`);

    if (screenshotAge > twelveHoursInMs) {
      console.log(`✅ Screenshots are older than 12 hours, will capture new ones`);
      return true;
    } else {
      console.log(`⏰ Screenshots are recent (less than 12 hours old), skipping capture`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error checking screenshot age for project ${projectId}:`, error.message);
    // If we can't check, err on the side of caution and capture new screenshots
    return true;
  }
}

async function deleteOldScreenshots(projectId) {
  try {
    console.log(`🗑️ Cleaning up old screenshots for project: ${projectId}`);
    
    // First, backup the screenshots
    await backupScreenshots(projectId);
    
    // List all resources in the project folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `project_${projectId}/`,
      max_results: 100
    });

    if (result.resources && result.resources.length > 0) {
      console.log(`📸 Found ${result.resources.length} old screenshots to delete`);
      
      // Delete all old screenshots
      const deletePromises = result.resources.map(resource => 
        cloudinary.uploader.destroy(resource.public_id)
      );
      
      await Promise.all(deletePromises);
      console.log(`✅ Deleted ${result.resources.length} old screenshots`);
    } else {
      console.log(`ℹ️ No old screenshots found for project: ${projectId}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting old screenshots for project ${projectId}:`, error.message);
    // Don't throw error - continue with new screenshot capture
  }
}

async function captureAndUpload(url, publicIdPrefix = 'project_screenshots', projectId = null) {
  // Check if we need to capture new screenshots (only if older than 12 hours)
  if (projectId) {
    const shouldCapture = await shouldCaptureNewScreenshot(projectId);
    if (!shouldCapture) {
      console.log(`⏰ Screenshots for project ${projectId} are recent (less than 12 hours old), skipping capture`);
      return null;
    }
    // Clean up old screenshots before capturing new ones
    await deleteOldScreenshots(projectId);
  }

  const browser = await puppeteer.launch({ 
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--force-device-scale-factor=1',
      '--high-dpi-support=1'
    ],
    headless: 'new'
  });
  
  try {
    const page = await browser.newPage();
    
    // Set high-quality viewport for 1080p screenshots
    await page.setViewport({ 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 1 // Ensure crisp 1:1 pixel ratio
    });
    
    // Set user agent for better compatibility
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 60000 // Increased timeout for heavy sites
    });

    // Wait for page to fully load and settle
    await page.waitForTimeout(3000);
    
    // Wait for any lazy-loaded images or content
    await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const timer = setInterval(() => {
          const newHeight = document.body.scrollHeight;
          if (newHeight !== totalHeight) {
            totalHeight = newHeight;
          } else {
            clearInterval(timer);
            resolve();
          }
        }, 100);
        
        // Resolve after 5 seconds regardless
        setTimeout(() => {
          clearInterval(timer);
          resolve();
        }, 5000);
      });
    });

    // Capture multiple screenshots for better coverage
    const screenshots = [];
    
    // Full page screenshot first
    const fullPageBuffer = await page.screenshot({
      fullPage: true,
      type: 'jpeg',
      quality: 95,
      optimizeForSpeed: false
    });
    
    // Viewport screenshot (1080p)
    const viewportBuffer = await page.screenshot({
      fullPage: false,
      type: 'jpeg',
      quality: 95,
      optimizeForSpeed: false,
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      }
    });

    // Upload both screenshots
    const timestamp = Date.now();
    
    // Upload full page screenshot
    const fullPageResult = await uploadBufferToCloudinary(fullPageBuffer, { 
      public_id: `${publicIdPrefix}/${timestamp}_fullpage`, 
      folder: publicIdPrefix,
      quality: 'auto:best',
      format: 'jpg',
      transformation: [
        { width: 1920, height: 1080, crop: 'fit', quality: 'auto:best' }
      ]
    });
    
    // Upload viewport screenshot (1080p)
    const viewportResult = await uploadBufferToCloudinary(viewportBuffer, { 
      public_id: `${publicIdPrefix}/${timestamp}_viewport`, 
      folder: publicIdPrefix,
      quality: 'auto:best',
      format: 'jpg'
    });

    console.log(`📸 Full page screenshot uploaded: ${fullPageResult.secure_url}`);
    console.log(`📸 Viewport screenshot uploaded: ${viewportResult.secure_url}`);
    
    // Return the viewport screenshot as primary (1080p)
    return viewportResult;
  } catch (error) {
    console.error(`❌ Error capturing ${url}:`, error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function restoreFromBackup(projectId, backupIndex = 0) {
  try {
    console.log(`🔄 Restoring screenshots from backup for project: ${projectId}`);
    
    // List all backup resources for this project
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `backup_screenshots/project_${projectId}/`,
      max_results: 100
    });

    if (result.resources && result.resources.length > 0) {
      console.log(`📸 Found ${result.resources.length} backup screenshots`);
      
      // Sort by creation date (newest first)
      const sortedBackups = result.resources.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      const backupToRestore = sortedBackups[backupIndex];
      if (!backupToRestore) {
        throw new Error(`Backup index ${backupIndex} not found`);
      }
      
      console.log(`🔄 Restoring backup: ${backupToRestore.public_id}`);
      
      // Copy backup to main project folder
      const restoreResult = await cloudinary.uploader.upload(backupToRestore.secure_url, {
        public_id: `project_${projectId}/${Date.now()}`,
        folder: `project_${projectId}`,
        resource_type: 'image',
        quality: 'auto:best'
      });
      
      console.log(`✅ Restored screenshot: ${restoreResult.secure_url}`);
      return restoreResult;
    } else {
      console.log(`ℹ️ No backup screenshots found for project: ${projectId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error restoring backup for project ${projectId}:`, error.message);
    throw error;
  }
}

async function listBackups(projectId) {
  try {
    console.log(`📋 Listing backups for project: ${projectId}`);
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `backup_screenshots/project_${projectId}/`,
      max_results: 100
    });

    if (result.resources && result.resources.length > 0) {
      const backups = result.resources.map((resource, index) => ({
        index,
        publicId: resource.public_id,
        url: resource.secure_url,
        createdAt: resource.created_at,
        size: resource.bytes,
        format: resource.format,
        width: resource.width,
        height: resource.height
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`📸 Found ${backups.length} backup screenshots`);
      return backups;
    } else {
      console.log(`ℹ️ No backup screenshots found for project: ${projectId}`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error listing backups for project ${projectId}:`, error.message);
    return [];
  }
}

module.exports = {
  captureAndUpload,
  backupScreenshots,
  deleteOldScreenshots,
  restoreFromBackup,
  listBackups,
  shouldCaptureNewScreenshot
};
