const express = require('express');
const multer = require('multer');
const pdfToImage = require('../utils/pdfToImage');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Convert PDF to image and upload to Cloudinary
router.post('/pdf-to-image', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    const { pageNumber = 1, width = 400, quality = 80 } = req.body;

    console.log('Converting PDF to image:', {
      filename: req.file.originalname,
      size: req.file.size,
      pageNumber: parseInt(pageNumber),
      width: parseInt(width),
      quality: parseInt(quality)
    });

    // Convert PDF to image
    const result = await pdfToImage.convertPDFToImage(req.file.buffer, {
      pageNumber: parseInt(pageNumber),
      quality: parseInt(quality) || 85
    });

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to convert PDF to image',
        error: result.error 
      });
    }

    // Upload image to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'portfolio/certificates/thumbnails',
          public_id: `pdf_thumb_${Date.now()}`,
          format: 'jpg',
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(result.imageBuffer);
    });

    console.log('PDF thumbnail uploaded to Cloudinary:', cloudinaryResult.public_id);

    res.json({
      success: true,
      thumbnail: {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });

  } catch (error) {
    console.error('PDF to image conversion error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Generate thumbnail for existing PDF
router.post('/generate-thumbnail/:certificateId/:fileId', async (req, res) => {
  try {
    const { certificateId, fileId } = req.params;
    const { pageNumber = 1, width = 400, quality = 80 } = req.body;

    // Get certificate and file info
    const Certificate = require('../models/Certificate');
    const certificate = await Certificate.findById(certificateId);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const file = certificate.files.find(f => f._id.toString() === fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (!file.mimeType.includes('pdf')) {
      return res.status(400).json({ message: 'File is not a PDF' });
    }

    // Download PDF from Cloudinary
    const pdfResponse = await fetch(file.url);
    if (!pdfResponse.ok) {
      return res.status(400).json({ message: 'Failed to download PDF' });
    }

    const pdfBuffer = await pdfResponse.buffer();

    // Convert PDF to image
    const result = await pdfToImage.convertPDFToImage(pdfBuffer, {
      pageNumber: parseInt(pageNumber),
      quality: parseInt(quality) || 85
    });

    if (!result.success) {
      return res.status(400).json({ 
        message: 'Failed to convert PDF to image',
        error: result.error 
      });
    }

    // Upload image to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'portfolio/certificates/thumbnails',
          public_id: `pdf_thumb_${certificateId}_${fileId}_${Date.now()}`,
          format: 'jpg',
          quality: 'auto',
          fetch_format: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(result.imageBuffer);
    });

    // Update file with thumbnail URL
    file.thumbnailUrl = cloudinaryResult.secure_url;
    await certificate.save();

    res.json({
      success: true,
      thumbnail: {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });

  } catch (error) {
    console.error('Generate thumbnail error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Clean up old temporary files
router.post('/cleanup', async (req, res) => {
  try {
    await pdfToImage.cleanupOldFiles();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      message: 'Cleanup failed',
      error: error.message 
    });
  }
});

module.exports = router;
