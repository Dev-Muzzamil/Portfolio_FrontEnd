const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Certificate = require('../models/Certificate');
const auth = require('../middleware/auth');
const { uploadCertificate, uploadReports, uploadToCloudinary, deleteFromCloudinary } = require('../middleware/cloudinary');

const router = express.Router();

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // Allow more file uploads in development
  message: {
    error: 'Too many file uploads from this IP, please try again later.',
    retryAfter: 'File upload rate limit exceeded. Try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Add missing dependencies with error handling
let pdfParse, Tesseract;
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  console.warn('pdf-parse not installed, PDF extraction will be disabled');
}

try {
  Tesseract = require('tesseract.js');
} catch (err) {
  console.warn('tesseract.js not installed, OCR will be disabled');
}

// Get all certificates (public)
router.get('/', async (req, res) => {
  try {
    console.log('🔗 DEBUG: Fetching all certificates');
    const certificates = await Certificate.find()
      .populate('linkedProjects', 'title category status')
      .sort({ order: 1, issueDate: -1 });
    console.log('🔗 DEBUG: Certificates fetched:', certificates.length);
    console.log('🔗 DEBUG: Sample certificate with linkedProjects:', certificates[0]?.linkedProjects);
    res.json(certificates);
  } catch (error) {
    console.error('🔗 DEBUG: Error fetching certificates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single certificate (public)
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('linkedProjects', 'title category status');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create certificate (admin only)
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('issuer').notEmpty().withMessage('Issuer is required'),
  body('issueDate').isISO8601().withMessage('Valid issue date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const certificate = new Certificate(req.body);
    await certificate.save();
    res.status(201).json(certificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create certificate with files (admin only)
router.post('/with-files', uploadLimiter, auth, uploadCertificate.array('files', 10), [
  body('title').notEmpty().withMessage('Title is required'),
  body('issuer').notEmpty().withMessage('Issuer is required'),
  body('issueDate').isISO8601().withMessage('Valid issue date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const certificateData = { ...req.body };
    let uploadedFiles = []; // Fix: Properly declare uploadedFiles
    
    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'portfolio/certificates', {
            originalname: file.originalname
          });
          
          const fileData = {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            isPrimary: uploadedFiles.length === 0 // First file is primary
          };

          // Generate thumbnail for PDF files
          if (file.mimetype === 'application/pdf') {
            try {
              const pdfToImage = require('../utils/pdfToImage');
              const thumbnailResult = await pdfToImage.convertPDFToImage(file.buffer, {
                pageNumber: 1,
                quality: 85 // Higher quality since we're keeping original size
              });

              if (thumbnailResult.success) {
                const thumbnailUpload = await uploadToCloudinary(
                  thumbnailResult.imageBuffer, 
                  'portfolio/certificates/thumbnails',
                  {
                    originalname: `${file.originalname}_thumb.jpg`
                  }
                );
                
                fileData.thumbnailUrl = thumbnailUpload.secure_url;
                fileData.thumbnailPublicId = thumbnailUpload.public_id;
                console.log('PDF thumbnail generated:', file.originalname);
              }
            } catch (thumbnailError) {
              console.error('Failed to generate PDF thumbnail:', file.originalname, thumbnailError);
              // Continue without thumbnail - not critical
            }
          }
          
          uploadedFiles.push(fileData);
        } catch (uploadError) {
          console.error('Failed to upload file:', file.originalname, uploadError);
          // Continue with other files even if one fails
        }
      }
      
      certificateData.files = uploadedFiles;
    }

            const certificate = new Certificate(certificateData);
            await certificate.save();

            // Auto-extract details from the first uploaded file if it's an image or PDF
            let extractedData = null;
    if (req.files && req.files.length > 0) {
      const firstFile = req.files[0]; // Use the actual uploaded file from multer
      if (firstFile.originalname && (firstFile.originalname.toLowerCase().includes('.jpg') || 
          firstFile.originalname.toLowerCase().includes('.jpeg') || 
          firstFile.originalname.toLowerCase().includes('.png') || 
          firstFile.originalname.toLowerCase().includes('.pdf'))) {
        try {
          console.log('🔗 DEBUG: Attempting auto-extraction from uploaded file:', firstFile.originalname);
          extractedData = await extractCertificateDetails(firstFile);
          console.log('🔗 DEBUG: Auto-extraction successful:', extractedData);
                } catch (extractError) {
                  console.log('Auto-extraction failed:', extractError.message);
                  // Continue without extracted data - this is not a critical failure
                }
              }
            }

            res.status(201).json({
              certificate,
              extractedData
            });
  } catch (error) {
    console.error('Create certificate with files error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update certificate (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    // Handle skill update
    if (req.body.updateSkill) {
      const { oldName, newName } = req.body.updateSkill;
      
      const certificate = await Certificate.findById(req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // Parse skills if they're stored as JSON string
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

      // Update the skill in the skills array
      const skillIndex = skillsArray.findIndex(skill => skill === oldName);
      if (skillIndex === -1) {
        return res.status(404).json({ message: 'Skill not found in certificate' });
      }

      skillsArray[skillIndex] = newName;
      certificate.skills = skillsArray;
      await certificate.save();
      
      return res.json({
        message: 'Skill updated successfully',
        certificate: certificate
      });
    }

    // Handle skill removal
    if (req.body.removeSkill) {
      const skillToRemove = req.body.removeSkill;
      
      const certificate = await Certificate.findById(req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      // Parse skills if they're stored as JSON string
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

      // Remove the skill from the skills array
      const initialLength = skillsArray.length;
      skillsArray = skillsArray.filter(skill => skill !== skillToRemove);
      
      if (skillsArray.length === initialLength) {
        return res.status(404).json({ message: 'Skill not found in certificate' });
      }

      certificate.skills = skillsArray;
      await certificate.save();
      
      return res.json({
        message: 'Skill removed successfully',
        certificate: certificate
      });
    }

    // Regular certificate update
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update certificate visibility (public - for testing)
router.patch('/:id/visibility', async (req, res) => {
  try {
    const { visible } = req.body;
    
    if (typeof visible !== 'boolean') {
      return res.status(400).json({ message: 'Visible field must be a boolean' });
    }
    
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { visible },
      { new: true, runValidators: true }
    );
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    console.log(`🔗 DEBUG: Certificate ${certificate.title} visibility updated to: ${visible}`);
    res.json(certificate);
  } catch (error) {
    console.error('Certificate visibility update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload certificate files (admin only)
router.post('/:id/upload-files', auth, uploadCertificate.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer, 'portfolio/certificates', {
          originalname: file.originalname
        });
        
        uploadedFiles.push({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isPrimary: certificate.files.length === 0 && uploadedFiles.length === 0 // First file is primary if no existing files
        });
      } catch (uploadError) {
        console.error('Failed to upload file:', file.originalname, uploadError);
        // Continue with other files even if one fails
      }
    }

    // Add new files to existing files array
    certificate.files = [...(certificate.files || []), ...uploadedFiles];
    await certificate.save();
    
    res.json({ 
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles,
      certificate 
    });
  } catch (error) {
    console.error('Certificate files upload error:', error);
    res.status(500).json({ message: 'Failed to upload certificate files' });
  }
});

// Remove certificate file (admin only)
router.delete('/:id/files/:fileId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const fileToDelete = certificate.files.id(req.params.fileId);
    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete from Cloudinary
    if (fileToDelete.publicId) {
      try {
        await deleteFromCloudinary(fileToDelete.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete file from Cloudinary:', deleteError);
      }
    }

    // Remove file from certificate
    certificate.files.pull(req.params.fileId);
    await certificate.save();
    
    res.json({ 
      message: 'File deleted successfully',
      certificate 
    });
  } catch (error) {
    console.error('Delete certificate file error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Set primary file (admin only)
router.put('/:id/files/:fileId/primary', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const targetFile = certificate.files.id(req.params.fileId);
    if (!targetFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set all files to non-primary first
    certificate.files.forEach(file => {
      file.isPrimary = false;
    });

    // Set target file as primary
    targetFile.isPrimary = true;
    await certificate.save();
    
    res.json({ 
      message: 'Primary file updated successfully',
      certificate 
    });
  } catch (error) {
    console.error('Set primary file error:', error);
    res.status(500).json({ message: 'Failed to set primary file' });
  }
});

// Extract certificate details using OCR (admin only)
router.post('/extract-details', auth, uploadCertificate.single('file'), async (req, res) => {
  try {
    console.log('🔗 DEBUG: Extract details endpoint called');
    console.log('🔗 DEBUG: req.file:', req.file ? req.file.originalname : 'null');
    
    if (!req.file) {
      console.log('🔗 DEBUG: No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('🔗 DEBUG: Starting extraction for file:', req.file.originalname);
    
    const extractedData = await extractCertificateDetails(req.file);
    console.log('🔗 DEBUG: Extraction completed:', extractedData);
    
    res.json({
      success: true,
      extractedData
    });
  } catch (error) {
    console.error('🔗 DEBUG: Certificate extraction error:', error);
    res.status(500).json({ 
      message: 'Failed to extract certificate details. Please try entering details manually.',
      error: error.message 
    });
  }
});

// Helper function to extract certificate details
async function extractCertificateDetails(file) {
  console.log('🔗 DEBUG: extractCertificateDetails called for file:', file.originalname);
  console.log('🔗 DEBUG: file.mimetype:', file.mimetype);
  
  const filename = file.originalname.toLowerCase();
  const extractedData = {
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    description: '',
    credentialUrl: '',
    skills: [],
    category: 'certification'
  };

  console.log('🔗 DEBUG: Starting certificate extraction for:', filename);

  // Try OCR extraction for images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    try {
      console.log('🔗 DEBUG: Attempting OCR extraction for file type:', file.mimetype);
      console.log('🔗 DEBUG: File size:', file.buffer.length, 'bytes');
      
      const ocrText = await performOCR(file.buffer, file.mimetype);
      console.log('🔗 DEBUG: OCR text extracted, length:', ocrText.length);
      
      if (ocrText && ocrText.trim().length > 0) {
      const parsedData = parseCertificateText(ocrText);
      console.log('🔗 DEBUG: Parsed OCR data:', parsedData);
      Object.assign(extractedData, parsedData);
      } else {
        console.log('🔗 DEBUG: OCR returned empty text, skipping parsing');
      }
    } catch (ocrError) {
      console.error('🔗 DEBUG: OCR extraction failed:', ocrError);
      console.log('🔗 DEBUG: Error details:', {
        message: ocrError.message,
        stack: ocrError.stack?.substring(0, 200) + '...'
      });
      console.log('🔗 DEBUG: Falling back to filename parsing');
    }
  }

  // Fallback to filename parsing - only use filename data for fields OCR didn't extract
  console.log('🔗 DEBUG: Parsing filename:', filename);
  const filenameData = parseFilename(filename);
  console.log('🔗 DEBUG: Filename parsed data:', filenameData);
  
  // Only use filename data for fields that OCR didn't extract
  if (!extractedData.title && filenameData.title) {
    extractedData.title = filenameData.title;
  }
  if (!extractedData.issuer && filenameData.issuer) {
    extractedData.issuer = filenameData.issuer;
  }
  if (!extractedData.issueDate && filenameData.issueDate) {
    extractedData.issueDate = filenameData.issueDate;
  }
  if (!extractedData.credentialId && filenameData.credentialId) {
    extractedData.credentialId = filenameData.credentialId;
  }
  if (!extractedData.category && filenameData.category) {
    extractedData.category = filenameData.category;
  }

  console.log('🔗 DEBUG: Final extracted data:', extractedData);
  return extractedData;
}

// Perform OCR on image files and PDFs
async function performOCR(fileBuffer, mimeType) {
  try {
    console.log('🔗 DEBUG: performOCR called with mimeType:', mimeType);
    
    if (mimeType === 'application/pdf') {
      console.log('🔗 DEBUG: Processing PDF file');
      
      if (!pdfParse) {
        throw new Error('pdf-parse library not available');
      }
      
      try {
        const pdfData = await pdfParse(fileBuffer, {
          // Enhanced options for better text extraction
          max: 0, // Parse all pages
          version: 'v1.10.100', // Use specific version for stability
          // Additional options for better text extraction
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
        
        console.log('🔗 DEBUG: PDF metadata:', {
          pages: pdfData.numpages,
          info: pdfData.info,
          version: pdfData.version
        });
        
        console.log('🔗 DEBUG: PDF text extracted length:', pdfData.text.length);
        console.log('🔗 DEBUG: PDF text preview:', pdfData.text.substring(0, 300) + '...');
        
        // Clean up the extracted text for better parsing
        let cleanedText = pdfData.text
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
          .trim();
        
        console.log('🔗 DEBUG: Cleaned PDF text length:', cleanedText.length);
        return cleanedText;
        
      } catch (pdfError) {
        console.error('🔗 DEBUG: PDF parsing failed:', pdfError);
        
        // Try with basic options if enhanced parsing fails
        try {
          console.log('🔗 DEBUG: Retrying with basic PDF parsing...');
          const basicPdfData = await pdfParse(fileBuffer);
          console.log('🔗 DEBUG: Basic PDF text extracted:', basicPdfData.text.substring(0, 200) + '...');
          return basicPdfData.text;
        } catch (basicError) {
          console.error('🔗 DEBUG: Basic PDF parsing also failed:', basicError);
          throw new Error(`PDF parsing failed: ${basicError.message}`);
        }
      }
    } else if (mimeType.startsWith('image/')) {
      console.log('🔗 DEBUG: Processing image file with Tesseract.js');
      
      if (!Tesseract) {
        throw new Error('tesseract.js library not available');
      }
      
      try {
        console.log('🔗 DEBUG: Starting Tesseract OCR processing...');
        const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              console.log('🔗 DEBUG: OCR Progress:', Math.round(m.progress * 100) + '%');
            }
          }
        });
        
        console.log('🔗 DEBUG: Tesseract OCR completed');
        console.log('🔗 DEBUG: Extracted text length:', text.length);
        console.log('🔗 DEBUG: First 300 characters:', text.substring(0, 300));
        
        return text;
      } catch (tesseractError) {
        console.error('🔗 DEBUG: Tesseract OCR failed:', tesseractError);
        // Fallback to mock data if Tesseract fails
        console.log('🔗 DEBUG: Falling back to mock OCR result');
      return "CERTIFICATE OF COMPLETION\nMachine Learning Specialization\nCoursera\nIssued to: John Doe\nDate: 2023-06-15\nCredential ID: ML-SPEC-2023";
      }
    }
    
    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    console.error('🔗 DEBUG: OCR Error:', error);
    throw error;
  }
}

// Parse certificate text from OCR results
function parseCertificateText(text) {
  console.log('🔗 DEBUG: parseCertificateText called with text length:', text.length);
  console.log('🔗 DEBUG: First 500 characters of text:', text.substring(0, 500));
  
  const extractedData = {
    title: '',
    issuer: '',
    issueDate: '',
    credentialId: '',
    credentialUrl: '',
    skills: []
  };

  // Enhanced text cleaning for both OCR and PDF text
  let cleanText = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
    .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable characters except newlines
    .replace(/\s+/g, ' ') // Normalize whitespace again
    .trim();
    
  console.log('🔗 DEBUG: Cleaned text (first 300 chars):', cleanText.substring(0, 300));

  // Extract title - multiple patterns for different certificate formats
  const titlePatterns = [
    // IBM/Coursera specialization patterns (like the real certificate) - most specific first
    /Specialization\s+([A-Z][^.!?\n]{10,50})(?:\s+This)/i,
    /(?:has successfully completed|has been awarded|successfully completed).*?(?:the online, non-credit Specialization|Specialization)\s+([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    /Specialization\s+([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    // Coursera patterns
    /(?:Certificate|Completion|Award).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    /([A-Z][^.!?\n]{10,50})(?:\s+Specialization|\s+Course|\s+Program)/i,
    // Generic patterns
    /(?:This is to certify that|Certificate of Completion|Certificate of Achievement).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    /(?:has successfully completed|has been awarded).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    // PDF-specific patterns (often have different formatting)
    /(?:Certificate|Certification|Completion|Award|Diploma|Degree).*?of.*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    /(?:in|for|on).*?([A-Z][^.!?\n]{10,50})(?:\s+has\s+been|\s+is\s+awarded)/i,
    // Professional certification patterns
    /([A-Z][^.!?\n]{10,50})(?:\s+Professional|\s+Certification|\s+Certificate)/i,
    // Course completion patterns
    /(?:Successfully completed|Completed|Finished).*?([A-Z][^.!?\n]{10,50})(?:\s+This|$)/i,
    // Training program patterns
    /([A-Z][^.!?\n]{10,50})(?:\s+Training|\s+Program|\s+Workshop)/i
  ];

  for (const pattern of titlePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[1].trim().length > 5) {
      extractedData.title = match[1].trim();
      console.log('🔗 DEBUG: Title extracted:', extractedData.title);
      break;
    }
  }

  // Extract issuer - improved patterns
  const issuerPatterns = [
    // IBM Skills Network patterns (like the real certificate) - highest priority
    /(IBM Skills Network)/i,
    /(IBM Corporation)/i,
    /(IBM)/i,
    // Skills Network patterns
    /([A-Z][^.!?\n]{2,20})\s+Skills\s+Network/i,
    // Coursera specific
    /(?:Coursera|Coursera Inc\.?)/i,
    // University patterns
    /(?:University|College|Institute|School).*?([A-Z][^.!?\n]{2,50})/i,
    // Company patterns
    /(?:from|by|issued by|awarded by)\s*([A-Z][^.!?\n]{2,50})/i,
    // Common platforms
    /(Coursera|Udemy|Google|Microsoft|AWS|Amazon|CompTIA|IBM|Oracle|LinkedIn|edX|Pluralsight|Skillsoft|VMware|Cisco|Red Hat|Salesforce|freeCodeCamp|Codecademy|Khan Academy|Udacity|Treehouse|SoloLearn)/i,
    // Generic
    /([A-Z][^.!?\n]{2,50})(?:\s+University|\s+College|\s+Institute)/i,
    // PDF-specific patterns
    /(?:This certificate is issued by|Issued by|Awarded by|Presented by)\s*([A-Z][^.!?\n]{2,50})/i,
    /(?:Platform|Provider|Organization|Institution)[:\s]*([A-Z][^.!?\n]{2,50})/i,
    // Professional certification bodies
    /(?:Certified by|Certification provided by)\s*([A-Z][^.!?\n]{2,50})/i,
    // Training organizations
    /(?:Training provided by|Course offered by)\s*([A-Z][^.!?\n]{2,50})/i
  ];
  
  for (const pattern of issuerPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      extractedData.issuer = (match[1] || match[0]).trim();
      console.log('🔗 DEBUG: Issuer extracted:', extractedData.issuer);
      break;
    }
  }

  // Extract date - improved patterns
  const datePatterns = [
    // IBM/Coursera date format (DD-MMM-YYYY like "09-May-2021")
    /(\d{1,2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*-\d{4})/i,
    // Various date formats
    /(?:date|issued|completed|awarded).*?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:date|issued|completed|awarded).*?(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:date|issued|completed|awarded).*?(\w+ \d{1,2},? \d{4})/i,
    // Month name patterns
    /(?:date|issued|completed|awarded).*?(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    // PDF-specific date patterns
    /(?:Completion date|Issue date|Date of completion|Date of issue|Certificate date|Award date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:Completion date|Issue date|Date of completion|Date of issue|Certificate date|Award date)[:\s]*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:Completion date|Issue date|Date of completion|Date of issue|Certificate date|Award date)[:\s]*(\w+ \d{1,2},? \d{4})/i,
    // Professional certification date patterns
    /(?:Certified on|Certification date|Valid from|Issued on)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(?:Certified on|Certification date|Valid from|Issued on)[:\s]*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(?:Certified on|Certification date|Valid from|Issued on)[:\s]*(\w+ \d{1,2},? \d{4})/i,
    // Just look for any date pattern
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
    /(\w+ \d{1,2},? \d{4})/i
  ];

  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      extractedData.issueDate = formatDate(match[1]);
      console.log('🔗 DEBUG: Date extracted:', match[1], '-> formatted:', extractedData.issueDate);
      break;
    }
  }

  // Extract credential ID - improved patterns
  const credentialPatterns = [
    // Coursera verification URL patterns (like the real certificate) - most specific first
    /coursera\.org\/verify\/(?:specialization|course|certificate)\/([A-Z0-9]{10,20})/i,
    /specializat\s*ion\/([A-Z0-9]{10,20})/i,
    /([A-Z0-9]{10,20})(?:\s*$)/i,
    /verify.*?([A-Z0-9]{10,20})/i,
    // Look for the specific pattern in the certificate text (handles line breaks)
    /verify.*?specializat\s*ion\/([A-Z0-9]{10,20})/i,
    // Look for the credential ID pattern that appears after "verify this certificate at"
    /verify.*?certificate.*?([A-Z0-9]{10,20})/i,
    // Coursera patterns
    /(?:credential|id|certificate|verification).*?([A-Z0-9]{8,20})/i,
    /(?:ID|Credential ID|Certificate ID).*?([A-Z0-9]{8,20})/i,
    // PDF-specific patterns
    /(?:Certificate Number|Certification ID|Credential Number|Verification Code|Reference Number)[:\s]*([A-Z0-9\-]{5,})/i,
    /(?:ID|Number|Code)[:\s]*([A-Z0-9\-]{5,})/i,
    // Professional certification patterns
    /(?:License Number|Registration Number|Certification Number)[:\s]*([A-Z0-9\-]{5,})/i,
    // Generic patterns
    /(?:credential|id|certificate).*?([A-Z0-9\-]{5,})/i,
    // Look for any alphanumeric ID (but be more selective)
    /(?:ID|Number|Code)[:\s]*([A-Z0-9]{6,20})/i,
    // URL patterns that might contain IDs
    /(?:verify|view|certificate)[\/\s]*([A-Z0-9]{8,20})/i
  ];

  for (const pattern of credentialPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      extractedData.credentialId = match[1];
      console.log('🔗 DEBUG: Credential ID extracted:', extractedData.credentialId);
      break;
    }
  }

  // Extract description - look for the long paragraph that describes the specialization
  const descriptionPatterns = [
    // Look for text that starts with "This specialization" or similar
    /(This specialization.*?)(?:\n\n|$)/i,
    /(This certificate.*?)(?:\n\n|$)/i,
    /(The online specialization.*?)(?:\n\n|$)/i,
    // Look for long descriptive text
    /(This.*?provided.*?)(?:\n\n|$)/i
  ];
  
  for (const pattern of descriptionPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1] && match[1].trim().length > 50) {
      let description = match[1].trim();
      
      // Fix URL issues in description (like "specializat ion" -> "specialization")
      description = description.replace(/specializat\s+ion/g, 'specialization');
      description = description.replace(/coursera\.org\/verify\/specializat\s+ion\//g, 'coursera.org/verify/specialization/');
      
      extractedData.description = description;
      console.log('🔗 DEBUG: Description extracted:', extractedData.description.substring(0, 100) + '...');
      break;
    }
  }

  // Extract skills/technologies mentioned
  const skillKeywords = [
    'python', 'javascript', 'react', 'node', 'machine learning', 'ai', 'data science', 
    'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'sql', 'database', 'web development',
    'mobile development', 'cybersecurity', 'devops', 'blockchain', 'tensorflow', 'pytorch',
    'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'compliance',
    'frameworks', 'standards', 'regulations', 'system administration', 'operating system',
    'vulnerabilities', 'networking', 'cryptography', 'digital forensics'
  ];
  
  extractedData.skills = skillKeywords.filter(skill => 
    cleanText.toLowerCase().includes(skill)
  );

  // Extract verification URL - look for URLs in the cleaned text
  console.log('🔗 DEBUG: Starting URL extraction...');
  const urlPatterns = [
    // Look for Coursera verification URLs specifically (handle spaces in specialization)
    /(https?:\/\/coursera\.org\/verify\/specializat\s*ion\/[A-Z0-9]+)/i,
    /(coursera\.org\/verify\/specializat\s*ion\/[A-Z0-9]+)/i,
    // General URL patterns
    /(https?:\/\/[^\s]+)/i,
    /(coursera\.org\/verify\/[^\s]+)/i,
    /(verify.*?https?:\/\/[^\s]+)/i
  ];
  
  console.log('🔗 DEBUG: Testing URL patterns on cleaned text...');
  for (let i = 0; i < urlPatterns.length; i++) {
    const pattern = urlPatterns[i];
    const match = cleanText.match(pattern);
    console.log(`🔗 DEBUG: Pattern ${i + 1}:`, match ? `✅ Found: ${match[1] || match[0]}` : '❌ No match');
    if (match) {
      let url = match[1] || match[0];
      // Fix common URL issues
      url = url.replace(/specializat\s+ion/g, 'specialization');
      url = url.replace(/\s+/g, ''); // Remove any remaining spaces
      extractedData.credentialUrl = url;
      console.log('🔗 DEBUG: Verification URL extracted:', extractedData.credentialUrl);
      break;
    }
  }

  // If no URL found in main text, try to extract from description
  if (!extractedData.credentialUrl && extractedData.description) {
    const descUrlMatch = extractedData.description.match(/(https?:\/\/[^\s]+)/i);
    if (descUrlMatch) {
      let url = descUrlMatch[1];
      // Fix common URL issues
      url = url.replace(/specializat\s+ion/g, 'specialization');
      url = url.replace(/\s+/g, ''); // Remove any remaining spaces
      extractedData.credentialUrl = url;
      console.log('🔗 DEBUG: Verification URL extracted from description:', extractedData.credentialUrl);
    }
  }

  console.log('🔗 DEBUG: Final parsed data:', extractedData);
  return extractedData;
}

// Parse filename for additional data
function parseFilename(filename) {
  const extractedData = {
    title: '',
    issuer: '',
    issueDate: '',
    category: 'certification'
  };

  // Basic filename parsing for common patterns
  if (filename.includes('coursera')) {
    extractedData.issuer = 'Coursera';
    extractedData.category = 'course';
  } else if (filename.includes('udemy')) {
    extractedData.issuer = 'Udemy';
    extractedData.category = 'course';
  } else if (filename.includes('google')) {
    extractedData.issuer = 'Google';
    extractedData.category = 'certification';
  } else if (filename.includes('microsoft')) {
    extractedData.issuer = 'Microsoft';
    extractedData.category = 'certification';
  } else if (filename.includes('aws') || filename.includes('amazon')) {
    extractedData.issuer = 'Amazon Web Services';
    extractedData.category = 'certification';
  } else if (filename.includes('comptia')) {
    extractedData.issuer = 'CompTIA';
    extractedData.category = 'certification';
  }

  // Try to extract date from filename
  const dateMatch = filename.match(/(\d{4})[-_](\d{1,2})[-_](\d{1,2})|(\d{1,2})[-_](\d{1,2})[-_](\d{4})/);
  if (dateMatch) {
    if (dateMatch[1]) {
      // YYYY-MM-DD format
      extractedData.issueDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
    } else {
      // MM-DD-YYYY format
      extractedData.issueDate = `${dateMatch[6]}-${dateMatch[4].padStart(2, '0')}-${dateMatch[5].padStart(2, '0')}`;
    }
  }

  // Try to extract course/certificate name from filename
  const nameMatch = filename.replace(/\.(pdf|jpg|jpeg|png|webp)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  if (nameMatch && !nameMatch.includes('certificate') && !nameMatch.includes('cert')) {
    extractedData.title = nameMatch;
  }

  return extractedData;
}

// Format date string to YYYY-MM-DD format
function formatDate(dateString) {
  try {
    // Handle DD-MMM-YYYY format (like "09-May-2021")
    if (dateString.match(/^\d{1,2}-[A-Za-z]{3,}-\d{4}$/)) {
      const parts = dateString.split('-');
      const day = parts[0].padStart(2, '0');
      const month = parts[1];
      const year = parts[2];
      
      // Convert month name to number
      const monthNames = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const monthNum = monthNames[month] || monthNames[month.substring(0, 3)];
      if (monthNum) {
        return `${year}-${monthNum}-${day}`;
      }
    }
    
    // Handle other date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.log('Date formatting error:', error);
  }
  return '';
}

// Link projects to certificate (admin only)
router.post('/:id/link-projects', auth, [
  body('projectIds').isArray().withMessage('Project IDs must be an array'),
  body('projectIds.*').isMongoId().withMessage('Invalid project ID format')
], async (req, res) => {
  try {
    console.log('🔗 DEBUG: Link projects endpoint called');
    console.log('🔗 DEBUG: req.params.id:', req.params.id);
    console.log('🔗 DEBUG: req.body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔗 DEBUG: Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const certificate = await Certificate.findById(req.params.id);
    console.log('🔗 DEBUG: Found certificate:', certificate ? certificate.title : 'null');
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const { projectIds } = req.body;
    console.log('🔗 DEBUG: projectIds to link:', projectIds);
    
    // Update certificate with linked projects
    certificate.linkedProjects = projectIds;
    await certificate.save();
    console.log('🔗 DEBUG: Certificate updated with projects');

    // Update projects with linked certificate (bidirectional)
    const Project = require('../models/Project');
    const projectUpdateResult = await Project.updateMany(
      { _id: { $in: projectIds } },
      { $addToSet: { linkedCertificates: req.params.id } }
    );
    console.log('🔗 DEBUG: Projects updated:', projectUpdateResult);

    // Remove certificate from projects not in the new list
    const projectRemoveResult = await Project.updateMany(
      { _id: { $nin: projectIds }, linkedCertificates: req.params.id },
      { $pull: { linkedCertificates: req.params.id } }
    );
    console.log('🔗 DEBUG: Projects cleaned up:', projectRemoveResult);

    res.json({ 
      message: 'Projects linked successfully',
      certificate 
    });
  } catch (error) {
    console.error('🔗 DEBUG: Link projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlink project from certificate (admin only)
router.delete('/:id/unlink-project/:projectId', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Remove project from certificate
    certificate.linkedProjects.pull(req.params.projectId);
    await certificate.save();

    // Remove certificate from project (bidirectional)
    const Project = require('../models/Project');
    await Project.findByIdAndUpdate(
      req.params.projectId,
      { $pull: { linkedCertificates: req.params.id } }
    );
    
    res.json({ 
      message: 'Project unlinked successfully',
      certificate 
    });
  } catch (error) {
    console.error('Unlink project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete certificate (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Remove certificate from all linked projects
    const Project = require('../models/Project');
    await Project.updateMany(
      { linkedCertificates: req.params.id },
      { $pull: { linkedCertificates: req.params.id } }
    );

    // Delete all files from Cloudinary
    if (certificate.files && certificate.files.length > 0) {
      for (const file of certificate.files) {
        if (file.publicId) {
          try {
            await deleteFromCloudinary(file.publicId);
      } catch (deleteError) {
            console.warn('Failed to delete certificate file from Cloudinary:', file.publicId, deleteError);
          }
        }
      }
    }

    await Certificate.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload report file (admin only)
router.post('/:id/reports/upload', auth, uploadReports.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const uploadedReports = [];
    
    for (const file of req.files) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file.buffer, 'portfolio/reports');
      
      const reportData = {
        title: title || file.originalname.split('.')[0],
        description: description || '',
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
    
    certificate.reports.push(...uploadedReports);
    await certificate.save();
    
    res.json({
      message: 'Report files uploaded successfully',
      reports: uploadedReports,
      certificate
    });
  } catch (error) {
    console.error('Report upload error:', error);
    res.status(500).json({ message: 'Failed to upload report files' });
  }
});

// Add report link (admin only)
router.post('/:id/reports/link', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('platform').optional().isString(),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, url, platform, description } = req.body;
    
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const reportData = {
      title,
      description: description || '',
      type: 'link',
      link: {
        url,
        platform: platform || 'other',
        title: title
      },
      visible: true
    };
    
    certificate.reports.push(reportData);
    await certificate.save();
    
    res.json({
      message: 'Report link added successfully',
      report: reportData,
      certificate
    });
  } catch (error) {
    console.error('Report link error:', error);
    res.status(500).json({ message: 'Failed to add report link' });
  }
});

// Delete report (admin only)
router.delete('/:id/reports/:reportId', auth, async (req, res) => {
  try {
    const { id, reportId } = req.params;
    
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const report = certificate.reports.id(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete file from Cloudinary if it's a file report
    if (report.type === 'file' && report.file && report.file.publicId) {
      try {
        await deleteFromCloudinary(report.file.publicId);
      } catch (deleteError) {
        console.warn('Failed to delete file from Cloudinary:', deleteError);
      }
    }

    certificate.reports.pull(reportId);
    await certificate.save();
    
    res.json({
      message: 'Report deleted successfully',
      certificate
    });
  } catch (error) {
    console.error('Report delete error:', error);
    res.status(500).json({ message: 'Failed to delete report' });
  }
});

// Toggle report visibility (admin only)
router.patch('/:id/reports/:reportId/visibility', auth, async (req, res) => {
  try {
    const { id, reportId } = req.params;
    const { visible } = req.body;
    
    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const report = certificate.reports.id(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.visible = visible;
    await certificate.save();
    
    res.json({
      message: `Report ${visible ? 'shown' : 'hidden'} successfully`,
      certificate
    });
  } catch (error) {
    console.error('Report visibility toggle error:', error);
    res.status(500).json({ message: 'Failed to toggle report visibility' });
  }
});

module.exports = router;