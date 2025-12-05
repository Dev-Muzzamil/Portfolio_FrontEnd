const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();

// Image upload (for profile photos only)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Certificate upload (allows any file type)
const uploadCertificate = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for certificates
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Allow common certificate file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain'
    ];
    
    const isAllowed = allowedTypes.some(type => 
      file.mimetype === type || file.mimetype.startsWith(type.split('/')[0])
    );
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, images, Word, text, and ODT files are allowed for certificates!'), false);
    }
  }
});

// Resume upload (allows documents and images)
const uploadResume = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for resume
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF, Word, images, and other common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
      'image/'
    ];
    
    const isAllowed = allowedTypes.some(type => 
      file.mimetype === type || file.mimetype.startsWith(type)
    );
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word, text, and image files are allowed for resume!'), false);
    }
  }
});

// Project files upload (allows multiple files, 500MB limit)
const uploadProjectFiles = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for project files
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for project files
    cb(null, true);
  }
});

// Reports upload (allows multiple files, 500MB limit)
const uploadReports = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for reports
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for reports
    cb(null, true);
  }
});

// Upload to Cloudinary
const uploadToCloudinary = async (buffer, folder = 'portfolio', options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultTransformations = {
      'portfolio/profile-photos': [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ],
      'portfolio/certificates': [
        { quality: 'auto' }
      ],
      'portfolio/certificates/thumbnails': [
        { quality: 'auto' }
      ],
      'portfolio/resume': [
        { quality: 'auto' }
      ],
      'portfolio/project-files': [
        { quality: 'auto' }
      ],
      'portfolio/reports': [
        { quality: 'auto' }
      ],
      'project_screenshots': [
        { quality: 'auto:best' }
      ]
    };

    // For resume folder, don't apply transformations to PDFs
    // For certificate thumbnails, don't apply any transformations
    const transformations = defaultTransformations[folder] || [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ];

    // Determine resource type based on folder and file type
    let resourceType = 'auto';
    if (folder === 'portfolio/resume' || folder === 'portfolio/certificates') {
      // For PDFs and documents, use raw to preserve original format
      if (options.originalname) {
        const ext = options.originalname.toLowerCase().split('.').pop();
        const documentExts = ['pdf', 'doc', 'docx', 'odt', 'txt'];
        if (documentExts.includes(ext)) {
          resourceType = 'raw';
        }
      }
    }
    
    // For PDFs specifically, ensure they're treated as raw files
    if (options.originalname && options.originalname.toLowerCase().endsWith('.pdf')) {
      resourceType = 'raw';
    }

    // Extract file extension from original filename if available
    let publicId = options.public_id;
    if (options.originalname && !publicId) {
      const fileExtension = options.originalname.split('.').pop();
      const baseName = options.originalname.split('.').slice(0, -1).join('.');
      // Create a clean public ID with proper extension
      publicId = `${baseName}_${Date.now()}.${fileExtension}`;
    }

    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      transformation: (folder === 'portfolio/resume' || folder === 'portfolio/certificates' || folder === 'portfolio/certificates/thumbnails' || resourceType === 'raw') ? undefined : transformations, // No transformations for resume/certificate folders, thumbnails, or raw files
      public_id: publicId, // Use the filename with extension
      access_mode: 'public', // Ensure files are publicly accessible
      use_filename: true, // Use original filename
      unique_filename: false, // Don't add random characters to filename
      invalidate: true, // Invalidate CDN cache
      overwrite: true, // Allow overwriting existing files
      ...options
    };

    console.log('Cloudinary upload options:', uploadOptions);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format
          });
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  upload,
  uploadCertificate,
  uploadResume,
  uploadProjectFiles,
  uploadReports,
  uploadToCloudinary,
  deleteFromCloudinary
};
