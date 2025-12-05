const express = require('express');
const { body, validationResult } = require('express-validator');
const About = require('../models/About');
const auth = require('../middleware/auth');
const { upload, uploadResume, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');

const router = express.Router();

// Get about info (public)
router.get('/', async (req, res) => {
  try {
    let about = await About.findOne();
    
    // If no about info exists, return default structure
    if (!about) {
      about = {
        name: 'Your Name',
        title: 'Full Stack Developer',
        bio: ['Add your bio here...'],
        shortBio: ['Add your short bio here...'],
        socialLinks: {},
        experience: [],
        education: []
      };
    }
    
    res.json(about);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update about info (admin only)
router.put('/', auth, [
  body('name').notEmpty().withMessage('Name is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('bio').isArray({ min: 1 }).withMessage('Bio must contain at least one paragraph'),
  body('bio.*').notEmpty().withMessage('Bio paragraphs cannot be empty'),
  body('shortBio').isArray({ min: 1 }).withMessage('Short bio must contain at least one paragraph'),
  body('shortBio.*').notEmpty().withMessage('Short bio paragraphs cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let about = await About.findOne();
    
    if (about) {
      about = await About.findByIdAndUpdate(about._id, req.body, { new: true, runValidators: true });
    } else {
      about = new About(req.body);
      await about.save();
    }
    
    res.json(about);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile photo (admin only)
router.post('/upload-photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'portfolio/profile-photos');

    // Update about info with new photo URL
    let about = await About.findOne();
    
    // Delete old photo from Cloudinary if it exists
    if (about && about.photo && about.photo.publicId) {
      try {
        await deleteFromCloudinary(about.photo.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete old photo:', deleteError);
      }
    }

    const photoData = {
      url: result.secure_url,
      publicId: result.public_id
    };

    if (about) {
      about = await About.findByIdAndUpdate(
        about._id, 
        { photo: photoData }, 
        { new: true, runValidators: true }
      );
    } else {
      about = new About({ photo: photoData });
      await about.save();
    }
    
    res.json({ 
      message: 'Profile photo uploaded successfully',
      photo: photoData,
      about 
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Delete profile photo (admin only)
router.delete('/photo', auth, async (req, res) => {
  try {
    let about = await About.findOne();
    
    if (!about || !about.photo) {
      return res.status(404).json({ message: 'No profile photo found' });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(about.photo.publicId);
    } catch (deleteError) {
      console.warn('Failed to delete photo from Cloudinary:', deleteError);
    }

    // Remove photo from database
    about = await About.findByIdAndUpdate(
      about._id, 
      { $unset: { photo: 1 } }, 
      { new: true }
    );
    
    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Photo delete error:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
});

// Upload resume (admin only)
router.post('/upload-resume', auth, uploadResume.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, documentType } = req.body;

    // Upload to Cloudinary with original filename
    const result = await uploadToCloudinary(req.file.buffer, 'portfolio/resume', {
      originalname: req.file.originalname
    });

    const resumeData = {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      title: title || req.file.originalname.split('.')[0],
      documentType: documentType || 'resume',
      isActive: false
    };

    let about = await About.findOne();
    
    if (about) {
      about.resumes.push(resumeData);
      await about.save();
    } else {
      about = new About({ resumes: [resumeData] });
      await about.save();
    }
    
    res.json({ 
      message: `${documentType === 'cv' ? 'CV' : 'Resume'} uploaded successfully`,
      resume: resumeData,
      about 
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Failed to upload resume' });
  }
});

// Delete specific resume (admin only)
router.delete('/resume/:resumeId', auth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    const resume = about.resumes.id(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(resume.publicId);
    } catch (deleteError) {
      console.warn('Failed to delete resume from Cloudinary:', deleteError);
    }

    // Remove resume from database
    about.resumes.pull(resumeId);
    await about.save();
    
    res.json({ message: 'Resume deleted successfully', about });
  } catch (error) {
    console.error('Resume delete error:', error);
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

// Set active resume (admin only)
router.put('/resume/:resumeId/active', auth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    // Set all resumes to inactive
    about.resumes.forEach(resume => {
      resume.isActive = false;
    });

    // Set selected resume as active
    const selectedResume = about.resumes.id(resumeId);
    if (!selectedResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    selectedResume.isActive = true;
    about.activeResumeId = resumeId;
    await about.save();
    
    res.json({ message: 'Active resume updated successfully', about });
  } catch (error) {
    console.error('Set active resume error:', error);
    res.status(500).json({ message: 'Failed to set active resume' });
  }
});

// Update resume title (admin only)
router.put('/resume/:resumeId', auth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { title } = req.body;
    
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    const resume = about.resumes.id(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    resume.title = title;
    await about.save();
    
    res.json({ message: 'Resume title updated successfully', about });
  } catch (error) {
    console.error('Update resume title error:', error);
    res.status(500).json({ message: 'Failed to update resume title' });
  }
});

// Download resume via API proxy (admin only)
router.get('/download-resume/:resumeId', auth, async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    const resume = about.resumes.id(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    console.log('Attempting to download resume:', resume.publicId);

    // Try to fetch the file directly first
    try {
      const response = await fetch(resume.url);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        
        // Set appropriate headers
        res.setHeader('Content-Type', resume.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Send the file
        return res.send(fileBuffer);
      }
    } catch (fetchError) {
      console.log('Direct fetch failed, trying Cloudinary SDK...', fetchError.message);
    }

    // Fallback: Use Cloudinary SDK with signed URL
    const cloudinary = require('cloudinary').v2;
    
    try {
      // Generate signed URL for secure access
      const signedUrl = cloudinary.utils.private_download_url(
        resume.publicId, 
        resume.originalName, 
        { 
          resource_type: 'raw',
          expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
        }
      );

      console.log('Generated signed URL:', signedUrl);

      // Fetch the file using the signed URL
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        console.error('Signed URL fetch failed:', response.status, response.statusText);
        return res.status(404).json({ message: 'File not found on Cloudinary' });
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      
      // Set appropriate headers
      res.setHeader('Content-Type', resume.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the file
      res.send(fileBuffer);
    } catch (signedUrlError) {
      console.log('Signed URL generation failed, trying regular URL...', signedUrlError.message);
      
      // Final fallback: try regular URL
      const response = await fetch(resume.url);
      if (!response.ok) {
        console.error('Regular URL fetch failed:', response.status, response.statusText);
        return res.status(404).json({ message: 'File not found' });
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      
      // Set appropriate headers
      res.setHeader('Content-Type', resume.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Send the file
      res.send(fileBuffer);
    }
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({ message: 'Failed to download resume', error: error.message });
  }
});

// Direct download endpoint using Cloudinary signed URLs (no auth required)
router.get('/download-resume-direct/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    const resume = about.resumes.id(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Only allow download of active resume for public access
    if (!resume.isActive) {
      return res.status(403).json({ message: 'Resume not available for public download' });
    }

    console.log('Direct download - Resume public ID:', resume.publicId);

    // Generate Cloudinary signed URL to bypass inline restrictions
    const cloudinary = require('cloudinary').v2;
    
    try {
      // Generate signed URL with fl_attachment for forced download
      const signedUrl = cloudinary.utils.private_download_url(
        resume.publicId, 
        resume.originalName, 
        { 
          resource_type: 'raw',
          flags: 'attachment'
        }
      );

      console.log('Generated signed download URL:', signedUrl);

      // Redirect to the signed Cloudinary download URL
      res.redirect(signedUrl);
    } catch (signedUrlError) {
      console.log('Signed URL generation failed, trying fl_attachment approach...', signedUrlError.message);
      
      // Fallback: Create download URL with fl_attachment
      const downloadUrl = cloudinary.url(resume.publicId, {
        resource_type: 'raw',
        flags: `attachment:${resume.originalName}`
      });

      console.log('Generated fallback download URL with fl_attachment:', downloadUrl);

      // Redirect to the Cloudinary download URL
      res.redirect(downloadUrl);
    }
  } catch (error) {
    console.error('Direct download resume error:', error);
    res.status(500).json({ message: 'Failed to generate download URL', error: error.message });
  }
});

// Public download endpoint (no auth required)
router.get('/public-download-resume/:resumeId', async (req, res) => {
  try {
    const { resumeId } = req.params;
    
    let about = await About.findOne();
    
    if (!about || !about.resumes || about.resumes.length === 0) {
      return res.status(404).json({ message: 'No resumes found' });
    }

    const resume = about.resumes.id(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Only allow download of active resume for public access
    if (!resume.isActive) {
      return res.status(403).json({ message: 'Resume not available for public download' });
    }

    console.log('Public download - Attempting to download resume:', resume.publicId);

    // Try to fetch the file directly first
    try {
      const response = await fetch(resume.url);
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        
        // Set appropriate headers
        res.setHeader('Content-Type', resume.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Send the file
        return res.send(fileBuffer);
      }
    } catch (fetchError) {
      console.log('Public download - Direct fetch failed, trying Cloudinary SDK...', fetchError.message);
    }

    // Fallback: Use Cloudinary SDK
    const cloudinary = require('cloudinary').v2;
    
    // Generate a signed URL for the file
    const signedUrl = cloudinary.url(resume.publicId, {
      resource_type: 'raw',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    });

    console.log('Public download - Generated signed URL:', signedUrl);

    // Fetch the file using the signed URL
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
      console.error('Public download - Signed URL fetch failed:', response.status, response.statusText);
      return res.status(404).json({ message: 'File not found on Cloudinary' });
    }

        const arrayBuffer = await response.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
    
    // Set appropriate headers
    res.setHeader('Content-Type', resume.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${resume.originalName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error('Public download resume error:', error);
    res.status(500).json({ message: 'Failed to download resume', error: error.message });
  }
});

module.exports = router;


