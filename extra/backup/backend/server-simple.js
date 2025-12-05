const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
require('dotenv').config();

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
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    return req.path === '/api/health' || 
           req.path.includes('/with-files') || 
           req.path.includes('/upload');
  }
});

app.use(limiter);

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
// NEW ARCHITECTURE ROUTES (v1) - Enhanced
// ========================================

// Import new services
const ScreenshotService = require('./services/content/ScreenshotService');
const PDFService = require('./services/content/PDFService');
const FileService = require('./services/content/FileService');
const EmailService = require('./services/communication/EmailService');
const ContactController = require('./controllers/public/ContactController');
const ReportService = require('./services/content/ReportService');
const BackupService = require('./services/system/BackupService');
const SchedulingService = require('./services/content/SchedulingService');
const MonitoringService = require('./services/system/MonitoringService');

// Public API routes (v1) - delegate to legacy for now
app.get('/api/v1/public/about', async (req, res) => {
  try {
    const About = require('./models/About');
    let about = await About.findOne();
    if (!about) {
      about = new About({});
      await about.save();
    }
    res.json(about);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/v1/public/projects', async (req, res) => {
  try {
    const Project = require('./models/Project');
    const projects = await Project.find({ visible: true })
      .populate('linkedCertificates', 'title issuer')
      .sort({ order: 1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/v1/public/certificates', async (req, res) => {
  try {
    const Certificate = require('./models/Certificate');
    const certificates = await Certificate.find({ visible: true })
      .populate('linkedProjects', 'title category')
      .sort({ order: 1, issueDate: -1 });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/v1/public/skills', async (req, res) => {
  try {
    // Use the same unified skills logic as the legacy API but with education integration
    const Skill = require('./models/Skill');
    const About = require('./models/About');
    const Project = require('./models/Project');
    const Certificate = require('./models/Certificate');
    
    // Get skill overrides from About model
    const about = await About.findOne();
    const skillOverrides = about?.skillOverrides || [];
    const education = about?.education || [];
    
    // Get all skills from the database
    const allSkills = await Skill.find().sort({ category: 1, name: 1 });
    
    // Get skills from visible projects
    const visibleProjects = await Project.find({ visible: true }).select('technologies title _id linkedSkills');
    const projectSkills = [];
    visibleProjects.forEach(project => {
      if (project.technologies && project.technologies.length > 0) {
        project.technologies.forEach(technology => {
          if (technology && technology.trim().length > 0) {
            const technologyTrimmed = technology.trim();
            projectSkills.push({
              name: technologyTrimmed,
              category: classifySkill(technologyTrimmed).category,
              group: classifySkill(technologyTrimmed).group,
              color: classifySkill(technologyTrimmed).color,
              visible: true,
              source: 'project',
              sourceName: project.title,
              sourceId: project._id.toString(),
              _id: `proj_${project._id}_${technologyTrimmed.replace(/\s+/g, '_').toLowerCase()}`,
              linkedProjects: [project._id],
              linkedCertificates: project.linkedCertificates || [],
              linkedEducation: education.filter(edu => 
                edu.linkedProjects && edu.linkedProjects.some(p => p.toString() === project._id.toString())
              ).map(edu => edu._id)
            });
          }
        });
      }
    });
    
    // Get skills from visible certificates
    const visibleCertificates = await Certificate.find({ visible: true }).select('skills title _id linkedProjects');
    const certificateSkills = [];
    visibleCertificates.forEach(certificate => {
      if (certificate.skills && certificate.skills.length > 0) {
        let skillsArray = certificate.skills;
        
        if (Array.isArray(skillsArray) && skillsArray.length === 1 && typeof skillsArray[0] === 'string' && skillsArray[0].startsWith('[')) {
          try {
            skillsArray = JSON.parse(skillsArray[0]);
          } catch (e) {
            // Keep as is if parsing fails
          }
        } else if (typeof skillsArray === 'string') {
          try {
            skillsArray = JSON.parse(skillsArray);
          } catch (e) {
            skillsArray = skillsArray.split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        }
        
        if (Array.isArray(skillsArray)) {
          skillsArray.forEach(skillName => {
            if (skillName && skillName.trim().length > 0) {
              const skillNameTrimmed = skillName.trim();
              certificateSkills.push({
                name: skillNameTrimmed,
                category: classifySkill(skillNameTrimmed).category,
                group: classifySkill(skillNameTrimmed).group,
                color: classifySkill(skillNameTrimmed).color,
                visible: true,
                source: 'certificate',
                sourceName: certificate.title,
                sourceId: certificate._id.toString(),
                _id: `cert_${certificate._id}_${skillNameTrimmed.replace(/\s+/g, '_').toLowerCase()}`,
                linkedProjects: certificate.linkedProjects || [],
                linkedCertificates: [certificate._id],
                linkedEducation: education.filter(edu => 
                  edu.linkedCertificates && edu.linkedCertificates.some(c => c.toString() === certificate._id.toString())
                ).map(edu => edu._id)
              });
            }
          });
        }
      }
    });
    
    // Get skills from education
    const educationSkills = [];
    education.forEach(edu => {
      if (edu.linkedSkills && edu.linkedSkills.length > 0) {
        edu.linkedSkills.forEach(skillId => {
          const skill = allSkills.find(s => s._id.toString() === skillId.toString());
          if (skill) {
            educationSkills.push({
              ...skill.toObject(),
              source: 'education',
              sourceName: `${edu.degree} at ${edu.institution}`,
              sourceId: edu._id.toString(),
              linkedProjects: edu.linkedProjects || [],
              linkedCertificates: edu.linkedCertificates || [],
              linkedEducation: [edu._id]
            });
          }
        });
      }
    });
    
    // Combine all skills and deduplicate
    const allUnifiedSkills = [...allSkills.map(s => ({
      ...s.toObject(),
      linkedProjects: [],
      linkedCertificates: [],
      linkedEducation: []
    })), ...projectSkills, ...certificateSkills, ...educationSkills];
    
    // Deduplicate skills by name
    const skillMap = new Map();
    allUnifiedSkills.forEach(skill => {
      const key = skill.name.toLowerCase().trim();
      if (skillMap.has(key)) {
        const existing = skillMap.get(key);
        // Merge linked content
        existing.linkedProjects = [...new Set([...existing.linkedProjects, ...(skill.linkedProjects || [])])];
        existing.linkedCertificates = [...new Set([...existing.linkedCertificates, ...(skill.linkedCertificates || [])])];
        existing.linkedEducation = [...new Set([...existing.linkedEducation, ...(skill.linkedEducation || [])])];
        // Update source if this is more specific
        if (skill.source && skill.source !== 'manual') {
          existing.source = skill.source;
          existing.sourceName = skill.sourceName;
          existing.sourceId = skill.sourceId;
        }
      } else {
        skillMap.set(key, skill);
      }
    });
    
    const unifiedSkills = Array.from(skillMap.values()).filter(skill => skill.visible !== false);
    
    res.json(unifiedSkills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to classify skills (copied from legacy)
function classifySkill(skillName) {
  const skill = skillName.toLowerCase().trim();
  
  // Frontend skills
  if (['html', 'css', 'javascript', 'react', 'vue', 'angular', 'svelte', 'typescript', 'jsx', 'tsx', 'sass', 'scss', 'less', 'bootstrap', 'tailwind', 'material-ui', 'styled-components', 'next.js', 'nuxt.js', 'gatsby'].includes(skill)) {
    return { category: 'frontend', group: 'web', color: '#3B82F6' };
  }
  
  // Backend skills
  if (['node.js', 'express', 'python', 'django', 'flask', 'fastapi', 'java', 'spring', 'c#', '.net', 'php', 'laravel', 'ruby', 'rails', 'go', 'rust', 'c++', 'c', 'kotlin', 'scala'].includes(skill)) {
    return { category: 'backend', group: 'programming', color: '#10B981' };
  }
  
  // Database skills
  if (['mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server', 'mariadb', 'cassandra', 'elasticsearch', 'neo4j', 'dynamodb'].includes(skill)) {
    return { category: 'database', group: 'data', color: '#F59E0B' };
  }
  
  // AI/ML skills
  if (['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'nlp', 'computer vision', 'ai', 'artificial intelligence'].includes(skill)) {
    return { category: 'ai-ml', group: 'intelligence', color: '#8B5CF6' };
  }
  
  // DevOps skills
  if (['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab', 'github actions', 'terraform', 'ansible', 'nginx', 'apache', 'linux', 'ubuntu', 'centos'].includes(skill)) {
    return { category: 'devops', group: 'infrastructure', color: '#EF4444' };
  }
  
  // Tools
  if (['git', 'github', 'gitlab', 'bitbucket', 'vscode', 'vim', 'emacs', 'postman', 'insomnia', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator'].includes(skill)) {
    return { category: 'tools', group: 'development', color: '#6B7280' };
  }
  
  // Default
  return { category: 'other', group: 'general', color: '#6B7280' };
}

app.get('/api/v1/public/configuration', async (req, res) => {
  try {
    const Configuration = require('./models/Configuration');
    let config = await Configuration.findOne();
    if (!config) {
      config = new Configuration({});
      await config.save();
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/v1/public/contact', [
  require('express-validator').body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  require('express-validator').body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  require('express-validator').body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject must be less than 200 characters'),
  require('express-validator').body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters')
], ContactController.sendContactMessage);

// GitHub profile endpoint
app.get('/api/v1/public/github/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // GitHub API token for authenticated requests
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      return res.status(400).json({ message: 'GitHub token is required for API access' });
    }
    
    const headers = {
      'Authorization': `bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    };

    // Get user profile using REST API
    const profileResponse = await axios.get(`https://api.github.com/users/${username}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const profile = profileResponse.data;

    // Get user repositories
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const repositories = reposResponse.data;

    res.json({
      profile,
      repositories,
      success: true
    });
  } catch (error) {
    console.error('GitHub API error:', error.message);
    res.status(500).json({ 
      message: 'Failed to fetch GitHub data',
      error: error.message 
    });
  }
});

// ========================================
// NEW ADMIN ROUTES (v1) - Enhanced Features
// ========================================

// Screenshot endpoints
app.post('/api/v1/admin/projects/:id/capture-screenshot', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ScreenshotService.captureScreenshotsForProject(id);

    if (result.success) {
      res.json({
        message: 'Screenshot captured successfully',
        ...result
      });
    } else {
      res.status(400).json({
        message: result.message,
        ...result
      });
    }
  } catch (error) {
    console.error('Capture screenshot error:', error);
    res.status(500).json({
      error: 'Failed to capture screenshot',
      code: 'CAPTURE_SCREENSHOT_ERROR'
    });
  }
});

app.get('/api/v1/admin/projects/:id/screenshots', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await ScreenshotService.getProjectScreenshots(id);

    if (result.success) {
      res.json(result.screenshots);
    } else {
      res.status(500).json({
        error: result.message,
        code: 'FETCH_SCREENSHOTS_ERROR'
      });
    }
  } catch (error) {
    console.error('Get project screenshots error:', error);
    res.status(500).json({
      error: 'Failed to fetch screenshots',
      code: 'FETCH_SCREENSHOTS_ERROR'
    });
  }
});

app.post('/api/v1/admin/projects/sync-screenshots', async (req, res) => {
  try {
    console.log('🔄 Manual screenshot sync triggered by admin');
    
    // Run the sync in background
    setImmediate(async () => {
      await ScreenshotService.syncScreenshotTimeline();
    });
    
    res.json({ 
      message: 'Screenshot sync started in background',
      status: 'initiated'
    });
  } catch (error) {
    console.error('Sync screenshots error:', error);
    res.status(500).json({
      error: 'Failed to start screenshot sync',
      code: 'SYNC_SCREENSHOTS_ERROR'
    });
  }
});

app.get('/api/v1/admin/projects/screenshot', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL parameter is required',
        code: 'MISSING_URL'
      });
    }

    const result = await ScreenshotService.generateScreenshot(url);

    if (result.success) {
      // Set proper headers
      res.set({
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'false'
      });

      res.send(result.data);
    } else {
      res.status(500).json({
        error: result.message,
        code: 'GENERATE_SCREENSHOT_ERROR'
      });
    }
  } catch (error) {
    console.error('Generate screenshot error:', error);
    res.status(500).json({
      error: 'Failed to generate screenshot',
      code: 'GENERATE_SCREENSHOT_ERROR'
    });
  }
});

// PDF processing endpoints
app.post('/api/v1/admin/certificates/extract-details', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('🔍 Extract details endpoint called for file:', req.file.originalname);
    
    const extractionResult = await PDFService.processCertificateFile(req.file);
    
    if (extractionResult.success) {
      res.json({
        success: true,
        extractedData: extractionResult.extractedData
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to extract certificate details. Please try entering details manually.',
        error: extractionResult.error
      });
    }
  } catch (error) {
    console.error('Certificate extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract certificate details. Please try entering details manually.',
      error: error.message
    });
  }
});

// Email test endpoint
app.get('/api/v1/admin/test-email', async (req, res) => {
  try {
    const result = await EmailService.testEmailConfiguration();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
});

// System monitoring endpoints
app.get('/api/v1/admin/health', async (req, res) => {
  try {
    const result = await MonitoringService.getHealthStatus();
    res.json(result.health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

app.get('/api/v1/admin/metrics', async (req, res) => {
  try {
    const result = await MonitoringService.getSystemMetrics();
    res.json(result.metrics);
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/admin/statistics', async (req, res) => {
  try {
    const result = await MonitoringService.getContentStatistics();
    res.json(result.statistics);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/admin/audit-statistics', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await MonitoringService.getAuditStatistics(days);
    res.json(result.statistics);
  } catch (error) {
    console.error('Audit statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/admin/alerts', async (req, res) => {
  try {
    const result = await MonitoringService.getSystemAlerts();
    res.json(result.alerts);
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backup and restore endpoints
app.post('/api/v1/admin/backup', async (req, res) => {
  try {
    const { name, models } = req.body;
    let result;
    
    if (models && Array.isArray(models)) {
      result = await BackupService.createPartialBackup(models, name);
    } else {
      result = await BackupService.createBackup(name);
    }
    
    if (result.success) {
      res.status(201).json({
        message: 'Backup created successfully',
        ...result
      });
    } else {
      res.status(500).json({
        error: result.error,
        code: 'CREATE_BACKUP_ERROR'
      });
    }
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      error: 'Failed to create backup',
      code: 'CREATE_BACKUP_ERROR'
    });
  }
});

app.get('/api/v1/admin/backups', async (req, res) => {
  try {
    const result = await BackupService.listBackups();
    res.json(result.backups);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/v1/admin/backups/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const { clearExisting = false, dryRun = false } = req.body;
    
    const result = await BackupService.restoreBackup(id, {
      clearExisting,
      dryRun
    });
    
    if (result.success) {
      res.json({
        message: dryRun ? 'Dry run completed' : 'Backup restored successfully',
        ...result
      });
    } else {
      res.status(500).json({
        error: result.error,
        code: 'RESTORE_BACKUP_ERROR'
      });
    }
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({
      error: 'Failed to restore backup',
      code: 'RESTORE_BACKUP_ERROR'
    });
  }
});

app.delete('/api/v1/admin/backups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await BackupService.deleteBackup(id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(500).json({
        error: result.error,
        code: 'DELETE_BACKUP_ERROR'
      });
    }
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({
      error: 'Failed to delete backup',
      code: 'DELETE_BACKUP_ERROR'
    });
  }
});

// Content scheduling endpoints
app.post('/api/v1/admin/schedule/publish', async (req, res) => {
  try {
    const { contentType, contentId, publishAt } = req.body;
    const result = await SchedulingService.schedulePublish(contentType, contentId, publishAt, 'system');
    
    if (result.success) {
      res.json({
        message: 'Content scheduled for publishing',
        ...result
      });
    } else {
      res.status(500).json({
        error: result.error,
        code: 'SCHEDULE_PUBLISH_ERROR'
      });
    }
  } catch (error) {
    console.error('Schedule publish error:', error);
    res.status(500).json({
      error: 'Failed to schedule publishing',
      code: 'SCHEDULE_PUBLISH_ERROR'
    });
  }
});

app.post('/api/v1/admin/schedule/unpublish', async (req, res) => {
  try {
    const { contentType, contentId, unpublishAt } = req.body;
    const result = await SchedulingService.scheduleUnpublish(contentType, contentId, unpublishAt, 'system');
    
    if (result.success) {
      res.json({
        message: 'Content scheduled for unpublishing',
        ...result
      });
    } else {
      res.status(500).json({
        error: result.error,
        code: 'SCHEDULE_UNPUBLISH_ERROR'
      });
    }
  } catch (error) {
    console.error('Schedule unpublish error:', error);
    res.status(500).json({
      error: 'Failed to schedule unpublishing',
      code: 'SCHEDULE_UNPUBLISH_ERROR'
    });
  }
});

app.get('/api/v1/admin/scheduled', async (req, res) => {
  try {
    const { contentType } = req.query;
    const result = await SchedulingService.getScheduledContent(contentType);
    res.json(result.scheduledContent);
  } catch (error) {
    console.error('Get scheduled content error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/v1/admin/scheduling-statistics', async (req, res) => {
  try {
    const result = await SchedulingService.getSchedulingStatistics();
    res.json(result.statistics);
  } catch (error) {
    console.error('Scheduling statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
const legacyAuthRoutes = require('./routes/auth');
const legacyGithubRoutes = require('./routes/github');

// Legacy API routes (for backward compatibility)
app.use('/api/projects', legacyProjectRoutes);
app.use('/api/certificates', legacyCertificateRoutes);
app.use('/api/skills', legacySkillRoutes);
app.use('/api/about', legacyAboutRoutes);
app.use('/api/configuration', legacyConfigurationRoutes);
app.use('/api/contact', legacyContactRoutes);
app.use('/api/upload', legacyUploadRoutes);
app.use('/api/pdf', legacyPdfRoutes);
app.use('/api/auth', legacyAuthRoutes);
app.use('/api/github', legacyGithubRoutes);

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
        admin: '/api/v1/admin/* (coming soon)',
        auth: '/api/v1/auth/* (coming soon)'
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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
📊 Architecture: New Optimized Backend (Simplified)
🔗 API Version: v1 (with legacy support)
🌐 Environment: ${process.env.NODE_ENV || 'development'}
📝 Available routes:
   • New API: /api/v1/public/*
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
