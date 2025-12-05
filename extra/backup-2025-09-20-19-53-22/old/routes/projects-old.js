const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const axios = require('axios');
const { uploadProjectFiles, uploadReports, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');
const { captureAndUpload } = require('../scripts/captureAndUpload');

const router = express.Router();

// Function to capture screenshots for a new project and sync timeline
async function captureScreenshotsForNewProject(project) {
  try {
    console.log(`📸 Capturing screenshots for new project: ${project.title}`);
    
    // Only capture if project has live URLs
    if (!project.liveUrls || project.liveUrls.length === 0) {
      console.log(`⏭️ Skipping screenshot capture - no live URLs for project: ${project.title}`);
      return;
    }

    // Capture screenshot for the first live URL
    const liveUrl = project.liveUrls[0];
    console.log(`🎯 Capturing screenshot for URL: ${liveUrl}`);
    
    const result = await captureAndUpload(liveUrl, `project_${project._id}`, project._id);
    
    if (result) {
      console.log(`✅ Screenshot captured successfully for project: ${project.title}`);
      
      // Update the project with the screenshot URL
      await Project.findByIdAndUpdate(project._id, {
        $push: {
          images: {
            url: result.secure_url,
            publicId: result.public_id,
            alt: `${project.title} screenshot`,
            isPrimary: true
          }
        }
      });
      
      console.log(`💾 Updated project with screenshot URL: ${project.title}`);
    } else {
      console.log(`⚠️ Screenshot capture skipped (recent screenshots exist) for project: ${project.title}`);
    }
  } catch (error) {
    console.error(`❌ Error capturing screenshots for project ${project.title}:`, error.message);
    // Don't throw error - project creation should still succeed even if screenshots fail
  }
}

// Function to sync screenshot timeline with other projects
async function syncScreenshotTimeline() {
  try {
    console.log(`🔄 Syncing screenshot timeline with other projects...`);
    
    // Get all projects with live URLs
    const projects = await Project.find({ 
      liveUrls: { $exists: true, $not: { $size: 0 } } 
    }).select('_id title liveUrls');
    
    if (projects.length === 0) {
      console.log(`ℹ️ No projects with live URLs found for timeline sync`);
      return;
    }
    
    console.log(`📋 Found ${projects.length} projects with live URLs`);
    
    // Capture screenshots for all projects to sync the timeline
    const capturePromises = projects.map(async (project) => {
      try {
        const liveUrl = project.liveUrls[0];
        console.log(`🎯 Syncing screenshot for project: ${project.title}`);
        
        const result = await captureAndUpload(liveUrl, `project_${project._id}`, project._id);
        
        if (result) {
          console.log(`✅ Screenshot synced for project: ${project.title}`);
        } else {
          console.log(`⏰ Screenshot sync skipped (recent) for project: ${project.title}`);
        }
      } catch (error) {
        console.error(`❌ Error syncing screenshot for project ${project.title}:`, error.message);
      }
    });
    
    await Promise.all(capturePromises);
    console.log(`🎉 Screenshot timeline sync completed`);
    
  } catch (error) {
    console.error(`❌ Error syncing screenshot timeline:`, error.message);
  }
}

// Get screenshot for a URL
router.get('/screenshot', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }

    console.log('Generating screenshot for:', url);

    // Try multiple screenshot services in order (only working ones)
    const services = [
      {
        name: 'microlink',
        url: `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`,
        contentType: 'image/jpeg'
      },
      {
        name: 'screenshotmachine-demo',
        url: `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=800x450&format=jpg&cacheLimit=0&delay=2000`,
        contentType: 'image/jpeg'
      }
    ];

    for (const service of services) {
      try {
        console.log(`Trying screenshot service: ${service.name}`);

        const response = await axios.get(service.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        console.log(`📡 ${service.name} response status:`, response.status);
        console.log(`📡 ${service.name} response headers:`, response.headers);
        console.log(`📡 ${service.name} response data size:`, response.data.length);

        // Get the actual content type from the response
        const actualContentType = response.headers['content-type'] || service.contentType;
        console.log(`📋 Actual content type:`, actualContentType);

        // Set proper headers
        res.set({
          'Content-Type': actualContentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Credentials': 'false'
        });

        console.log(`Screenshot generated successfully using ${service.name}`);
        return res.send(response.data);

      } catch (error) {
        console.warn(`${service.name} failed:`, error.message);
        continue;
      }
    }

    // All services failed
    throw new Error('All screenshot services failed');

  } catch (error) {
    console.error('Screenshot generation error:', error);

    // Return error response
    res.status(500).json({
      message: 'Failed to generate screenshot',
      error: error.message
    });
  }
});

// Get existing screenshots for a project (admin only)
router.get('/screenshots/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Use Cloudinary API to list screenshots for this project
    const cloudinary = require('cloudinary').v2;
    
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: `project_${projectId}/`,
      max_results: 100,
      sort_by: [{ created_at: 'desc' }]
    });

    if (result.resources && result.resources.length > 0) {
      const screenshots = result.resources.map(resource => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        createdAt: resource.created_at,
        size: resource.bytes,
        format: resource.format,
        width: resource.width,
        height: resource.height
      }));
      
      res.json(screenshots);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ message: 'Failed to fetch screenshots' });
  }
});

// Manual screenshot sync endpoint (admin only)
router.post('/sync-screenshots', auth, async (req, res) => {
  try {
    console.log('🔄 Manual screenshot sync triggered by admin');
    
    // Run the sync in background
    setImmediate(async () => {
      await syncScreenshotTimeline();
    });
    
    res.json({ 
      message: 'Screenshot sync started in background',
      status: 'initiated'
    });
  } catch (error) {
    console.error('Manual screenshot sync error:', error);
    res.status(500).json({ message: 'Failed to start screenshot sync' });
  }
});

// Manual screenshot capture for specific project (admin only)
router.post('/:id/capture-screenshot', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!project.liveUrls || project.liveUrls.length === 0) {
      return res.status(400).json({ message: 'Project has no live URLs to capture' });
    }

    const liveUrl = project.liveUrls[0];
    console.log(`📸 Manual screenshot capture for project: ${project.title} - URL: ${liveUrl}`);

    const result = await captureAndUpload(liveUrl, `project_${project._id}`, project._id);
    
    if (result) {
      // Update the project with the new screenshot URL
      await Project.findByIdAndUpdate(project._id, {
        $push: {
          images: {
            url: result.secure_url,
            publicId: result.public_id,
            alt: `${project.title} screenshot`,
            isPrimary: true
          }
        }
      });

      res.json({ 
        success: true, 
        message: 'Screenshot captured successfully',
        screenshot: {
          url: result.secure_url,
          publicId: result.public_id
        }
      });
    } else {
      res.json({ 
        success: false, 
        message: 'Screenshot capture skipped (recent screenshots exist)' 
      });
    }
  } catch (error) {
    console.error('Manual screenshot capture error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to capture screenshot',
      error: error.message 
    });
  }
});

// Get all projects (public)
router.get('/', async (req, res) => {
  try {
    console.log('🔗 DEBUG: Fetching all projects');
    const projects = await Project.find()
      .populate('linkedCertificates', 'title issuer')
      .sort({ order: 1, createdAt: -1 });
    console.log('🔗 DEBUG: Projects fetched:', projects.length);
    console.log('🔗 DEBUG: Sample project with linkedCertificates:', projects[0]?.linkedCertificates);
    console.log('🔗 DEBUG: Sample project completedAtInstitution:', projects[0]?.completedAtInstitution);
    res.json(projects);
  } catch (error) {
    console.error('🔗 DEBUG: Error fetching projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project (public)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('linkedCertificates', 'title issuer');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create project (admin only)
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('shortDescription').notEmpty().withMessage('Short description is required'),
  body('technologies').isArray().withMessage('Technologies must be an array'),
  body('liveUrls').optional().isArray().withMessage('Live URLs must be an array'),
  body('githubUrls').optional().isArray().withMessage('GitHub URLs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Truncate shortDescription if it's too long
    if (req.body.shortDescription && req.body.shortDescription.length > 500) {
      req.body.shortDescription = req.body.shortDescription.substring(0, 497) + '...';
    }

    const project = new Project(req.body);
    await project.save();
    
    // Capture screenshots for the new project and sync timeline (async, don't wait)
    setImmediate(async () => {
      try {
        // First capture screenshot for the new project
        await captureScreenshotsForNewProject(project);
        
        // Then sync the timeline with all other projects
        await syncScreenshotTimeline();
      } catch (error) {
        console.error('Error in post-creation screenshot process:', error);
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Handle technology update
    if (req.body.updateTechnology) {
      const { oldName, newName } = req.body.updateTechnology;
      
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Update the technology in the technologies array
      const technologyIndex = project.technologies.findIndex(tech => tech === oldName);
      if (technologyIndex === -1) {
        return res.status(404).json({ message: 'Technology not found in project' });
      }

      project.technologies[technologyIndex] = newName;
      await project.save();
      
      return res.json({
        message: 'Technology updated successfully',
        project: project
      });
    }

    // Handle technology removal
    if (req.body.removeTechnology) {
      const technologyToRemove = req.body.removeTechnology;
      
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Remove the technology from the technologies array
      const initialLength = project.technologies.length;
      project.technologies = project.technologies.filter(tech => tech !== technologyToRemove);
      
      if (project.technologies.length === initialLength) {
        return res.status(404).json({ message: 'Technology not found in project' });
      }

      await project.save();
      
      return res.json({
        message: 'Technology removed successfully',
        project: project
      });
    }

    // Regular project update
    // Truncate shortDescription if it's too long
    if (req.body.shortDescription && req.body.shortDescription.length > 500) {
      req.body.shortDescription = req.body.shortDescription.substring(0, 497) + '...';
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Project update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project visibility (public - for testing)
router.patch('/:id/visibility', async (req, res) => {
  try {
    const { visible } = req.body;
    
    if (typeof visible !== 'boolean') {
      return res.status(400).json({ message: 'Visible field must be a boolean' });
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { visible },
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    console.log(`🔗 DEBUG: Project ${project.title} visibility updated to: ${visible}`);
    res.json(project);
  } catch (error) {
    console.error('Project visibility update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload project files (admin only)
router.post('/:id/files', auth, uploadProjectFiles.array('files', 10), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'portfolio/project-files');
      
      const fileData = {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        description: req.body.description || '',
        visible: true
      };
      
      uploadedFiles.push(fileData);
    }

    project.projectFiles.push(...uploadedFiles);
    await project.save();

    res.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      project 
    });
  } catch (error) {
    console.error('Project files upload error:', error);
    res.status(500).json({ message: 'Failed to upload files' });
  }
});

// Delete project file (admin only)
router.delete('/:id/files/:fileId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const fileIndex = project.projectFiles.findIndex(file => file._id.toString() === req.params.fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = project.projectFiles[fileIndex];
    
    // Delete from Cloudinary
    if (file.publicId) {
      try {
        await deleteFromCloudinary(file.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete file from Cloudinary:', deleteError);
      }
    }

    project.projectFiles.splice(fileIndex, 1);
    await project.save();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Project file delete error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Add report (admin only)
router.post('/:id/reports', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['file', 'link']).withMessage('Type must be file or link'),
  body('file').optional().isObject(),
  body('link').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const reportData = {
      title: req.body.title,
      description: req.body.description || '',
      type: req.body.type,
      visible: req.body.visible !== 'false'
    };

    if (req.body.type === 'file' && req.body.file) {
      reportData.file = req.body.file;
    } else if (req.body.type === 'link' && req.body.link) {
      reportData.link = req.body.link;
    }

    project.reports.push(reportData);
    await project.save();

    res.json({ 
      message: 'Report added successfully',
      report: reportData,
      project 
    });
  } catch (error) {
    console.error('Report add error:', error);
    res.status(500).json({ message: 'Failed to add report' });
  }
});

// Upload report file (admin only)
router.post('/:id/reports/upload', auth, uploadReports.array('files', 5), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedReports = [];
    
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'portfolio/reports');
      
      const reportData = {
        title: req.body.title || file.originalname,
        description: req.body.description || '',
        type: 'file',
        file: {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        },
        visible: true
      };
      
      uploadedReports.push(reportData);
    }

    project.reports.push(...uploadedReports);
    await project.save();

    res.json({ 
      message: 'Report files uploaded successfully',
      reports: uploadedReports,
      project 
    });
  } catch (error) {
    console.error('Report files upload error:', error);
    res.status(500).json({ message: 'Failed to upload report files' });
  }
});

// Delete report (admin only)
router.delete('/:id/reports/:reportId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const reportIndex = project.reports.findIndex(report => report._id.toString() === req.params.reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const report = project.reports[reportIndex];
    
    // Delete file from Cloudinary if it's a file report
    if (report.type === 'file' && report.file && report.file.publicId) {
      try {
        await deleteFromCloudinary(report.file.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete report file from Cloudinary:', deleteError);
      }
    }

    project.reports.splice(reportIndex, 1);
    await project.save();

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Report delete error:', error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

// Link certificates to project (admin only)
router.post('/:id/link-certificates', auth, [
  body('certificateIds').isArray().withMessage('Certificate IDs must be an array'),
  body('certificateIds.*').isMongoId().withMessage('Invalid certificate ID format')
], async (req, res) => {
  try {
    console.log('🔗 DEBUG: Link certificates endpoint called');
    console.log('🔗 DEBUG: req.params.id:', req.params.id);
    console.log('🔗 DEBUG: req.body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔗 DEBUG: Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findById(req.params.id);
    console.log('🔗 DEBUG: Found project:', project ? project.title : 'null');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const { certificateIds } = req.body;
    console.log('🔗 DEBUG: certificateIds to link:', certificateIds);
    
    // Update project with linked certificates
    project.linkedCertificates = certificateIds;
    await project.save();
    console.log('🔗 DEBUG: Project updated with certificates');

    // Update certificates with linked project (bidirectional)
    const Certificate = require('../models/Certificate');
    const certificateUpdateResult = await Certificate.updateMany(
      { _id: { $in: certificateIds } },
      { $addToSet: { linkedProjects: req.params.id } }
    );
    console.log('🔗 DEBUG: Certificates updated:', certificateUpdateResult);

    // Remove project from certificates not in the new list
    const certificateRemoveResult = await Certificate.updateMany(
      { _id: { $nin: certificateIds }, linkedProjects: req.params.id },
      { $pull: { linkedProjects: req.params.id } }
    );
    console.log('🔗 DEBUG: Certificates cleaned up:', certificateRemoveResult);

    res.json({ 
      message: 'Certificates linked successfully',
      project 
    });
  } catch (error) {
    console.error('🔗 DEBUG: Link certificates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlink certificate from project (admin only)
router.delete('/:id/unlink-certificate/:certificateId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Remove certificate from project
    project.linkedCertificates.pull(req.params.certificateId);
    await project.save();

    // Remove project from certificate (bidirectional)
    const Certificate = require('../models/Certificate');
    await Certificate.findByIdAndUpdate(
      req.params.certificateId,
      { $pull: { linkedProjects: req.params.id } }
    );

    res.json({ 
      message: 'Certificate unlinked successfully',
      project 
    });
  } catch (error) {
    console.error('Unlink certificate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


