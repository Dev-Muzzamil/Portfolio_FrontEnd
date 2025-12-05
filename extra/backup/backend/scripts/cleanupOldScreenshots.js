const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function connectDB() {
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
    console.log('✅ Database connected for cleanup');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function cleanupOldScreenshots() {
  try {
    await connectDB();
    
    const Project = require('../models/Project');
    const projects = await Project.find({ 
      liveUrls: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    console.log(`🧹 Starting cleanup for ${projects.length} projects`);

    let totalDeleted = 0;
    let totalProjectsProcessed = 0;

    for (const project of projects) {
      try {
        console.log(`\n🔍 Processing project: ${project.title} (${project._id})`);
        
        // List all resources in the project folder
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: `project_${project._id}/`,
          max_results: 100
        });

        if (result.resources && result.resources.length > 0) {
          console.log(`📸 Found ${result.resources.length} screenshots for ${project.title}`);
          
          // Delete all screenshots for this project
          const deletePromises = result.resources.map(resource => 
            cloudinary.uploader.destroy(resource.public_id)
          );
          
          await Promise.all(deletePromises);
          totalDeleted += result.resources.length;
          console.log(`✅ Deleted ${result.resources.length} screenshots for ${project.title}`);
        } else {
          console.log(`ℹ️ No screenshots found for ${project.title}`);
        }

        totalProjectsProcessed++;
        
        // Small delay between projects
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing project ${project.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Projects processed: ${totalProjectsProcessed}`);
    console.log(`🗑️ Total screenshots deleted: ${totalDeleted}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    } catch (err) {
      console.warn('⚠️ Error closing database connection:', err.message);
    }
  }
}

// CLI execution
if (require.main === module) {
  console.log('🧹 Starting manual screenshot cleanup...');
  
  cleanupOldScreenshots()
    .then(() => {
      console.log('✅ Cleanup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupOldScreenshots;
