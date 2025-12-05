const mongoose = require('mongoose');
const { backupScreenshots, restoreFromBackup, listBackups } = require('./captureAndUpload');
require('dotenv').config();

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
    console.log('✅ Database connected for backup manager');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function backupAllProjects() {
  try {
    await connectDB();
    
    const Project = require('../models/Project');
    const projects = await Project.find({ 
      liveUrls: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    console.log(`💾 Starting backup for ${projects.length} projects`);

    let totalBackedUp = 0;
    let totalProjectsProcessed = 0;

    for (const project of projects) {
      try {
        console.log(`\n🔍 Backing up project: ${project.title} (${project._id})`);
        
        const backupResults = await backupScreenshots(project._id);
        totalBackedUp += backupResults.length;
        totalProjectsProcessed++;
        
        console.log(`✅ Backed up ${backupResults.length} screenshots for ${project.title}`);
        
        // Small delay between projects
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error backing up project ${project.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Backup completed!`);
    console.log(`📊 Projects processed: ${totalProjectsProcessed}`);
    console.log(`💾 Total screenshots backed up: ${totalBackedUp}`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
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

async function listAllBackups() {
  try {
    await connectDB();
    
    const Project = require('../models/Project');
    const projects = await Project.find({ 
      liveUrls: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    console.log(`📋 Listing backups for ${projects.length} projects`);

    for (const project of projects) {
      try {
        console.log(`\n📸 Project: ${project.title} (${project._id})`);
        const backups = await listBackups(project._id);
        
        if (backups.length > 0) {
          console.log(`   Found ${backups.length} backup screenshots:`);
          backups.forEach((backup, index) => {
            console.log(`   ${index + 1}. ${backup.publicId}`);
            console.log(`      Created: ${new Date(backup.createdAt).toLocaleString()}`);
            console.log(`      Size: ${(backup.size / 1024).toFixed(2)} KB`);
            console.log(`      Dimensions: ${backup.width}x${backup.height}`);
          });
        } else {
          console.log(`   No backups found`);
        }
        
      } catch (error) {
        console.error(`❌ Error listing backups for project ${project.title}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ List backups failed:', error.message);
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

async function restoreProject(projectId, backupIndex = 0) {
  try {
    await connectDB();
    
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log(`🔄 Restoring project: ${project.title} (${projectId})`);
    
    const restoreResult = await restoreFromBackup(projectId, backupIndex);
    
    if (restoreResult) {
      // Update project with restored screenshot
      await Project.findByIdAndUpdate(projectId, {
        $set: {
          images: [{
            url: restoreResult.secure_url,
            alt: `${project.title} screenshot (restored)`
          }]
        }
      });
      
      console.log(`✅ Successfully restored screenshot for ${project.title}`);
      console.log(`🔗 Restored URL: ${restoreResult.secure_url}`);
    } else {
      console.log(`ℹ️ No backup found to restore for ${project.title}`);
    }

  } catch (error) {
    console.error('❌ Restore failed:', error.message);
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
  const command = process.argv[2];
  const projectId = process.argv[3];
  const backupIndex = parseInt(process.argv[4]) || 0;

  switch (command) {
    case 'backup-all':
      console.log('💾 Starting backup for all projects...');
      backupAllProjects()
        .then(() => {
          console.log('✅ Backup completed successfully');
          process.exit(0);
        })
        .catch(error => {
          console.error('💥 Backup failed:', error);
          process.exit(1);
        });
      break;

    case 'list':
      console.log('📋 Listing all backups...');
      listAllBackups()
        .then(() => {
          console.log('✅ List completed successfully');
          process.exit(0);
        })
        .catch(error => {
          console.error('💥 List failed:', error);
          process.exit(1);
        });
      break;

    case 'restore':
      if (!projectId) {
        console.error('❌ Project ID is required for restore command');
        console.log('Usage: node backupManager.js restore <projectId> [backupIndex]');
        process.exit(1);
      }
      console.log(`🔄 Restoring project ${projectId}...`);
      restoreProject(projectId, backupIndex)
        .then(() => {
          console.log('✅ Restore completed successfully');
          process.exit(0);
        })
        .catch(error => {
          console.error('💥 Restore failed:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('📖 Backup Manager Commands:');
      console.log('  backup-all                    - Backup all projects');
      console.log('  list                          - List all backups');
      console.log('  restore <projectId> [index]   - Restore project from backup');
      console.log('');
      console.log('Examples:');
      console.log('  node backupManager.js backup-all');
      console.log('  node backupManager.js list');
      console.log('  node backupManager.js restore 507f1f77bcf86cd799439011');
      console.log('  node backupManager.js restore 507f1f77bcf86cd799439011 0');
      break;
  }
}

module.exports = {
  backupAllProjects,
  listAllBackups,
  restoreProject
};
