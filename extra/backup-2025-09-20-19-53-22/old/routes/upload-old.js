const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload branding images (logo, icon, etc.)
router.post('/branding', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file size based on type
    const maxSize = req.file.originalname.toLowerCase().includes('icon') ? 1024 * 1024 : 2 * 1024 * 1024; // 1MB for icons, 2MB for logos
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'portfolio/branding');

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Branding upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload file' 
    });
  }
});

// Delete branding image
router.delete('/branding/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Branding delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete file' 
    });
  }
});

module.exports = router;
