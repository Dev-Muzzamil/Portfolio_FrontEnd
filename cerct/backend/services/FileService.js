/**
 * File Service - Certificate File Handling
 * Handles file upload, download, and management operations for certificates
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { AppError } = require('../../middleware/errorMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class FileService {
  constructor() {
    this.allowedMimeTypes = {
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
      videos: ['video/mp4', 'video/webm', 'video/quicktime']
    };

    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.setupMulter();
  }

  /**
   * Setup multer configuration
   */
  setupMulter() {
    const storage = multer.memoryStorage();
    
    this.uploader = multer({
      storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 10
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      }
    });
  }

  /**
   * Validate uploaded file
   */
  validateFile(file, cb) {
    const allowedTypes = [
      ...this.allowedMimeTypes.images,
      ...this.allowedMimeTypes.documents,
      ...this.allowedMimeTypes.archives,
      ...this.allowedMimeTypes.videos
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false);
    }
  }

  /**
   * Upload single file to Cloudinary
   */
  async uploadFile(file, folder = 'portfolio/files', resourceType = 'auto', options = {}) {
    try {
      if (!file || !file.buffer) {
        throw new AppError('No file provided for upload', 400);
      }

      if (file.size > this.maxFileSize) {
        throw new AppError(`File size ${file.size} exceeds maximum allowed size ${this.maxFileSize}`, 400);
      }

      if (resourceType === 'auto') {
        if (this.allowedMimeTypes.images.includes(file.mimetype)) {
          resourceType = 'image';
        } else if (this.allowedMimeTypes.videos.includes(file.mimetype)) {
          resourceType = 'video';
        } else {
          resourceType = 'raw';
        }
      }

      const uploadOptions = {
        resource_type: resourceType,
        folder,
        public_id: `${file.originalname}_${Date.now()}`,
        ...options
      };

      if (resourceType === 'image') {
        uploadOptions.quality = 'auto';
        uploadOptions.fetch_format = 'auto';
      }

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(file.buffer);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        format: result.format,
        width: result.width,
        height: result.height,
        uploadedAt: new Date()
      };
    } catch (error) {
      console.error('❌ File upload failed:', error.message);
      throw new AppError(`File upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files, folder = 'portfolio/files', options = {}) {
    try {
      if (!files || files.length === 0) {
        throw new AppError('No files provided for upload', 400);
      }

      if (files.length > 10) {
        throw new AppError('Maximum 10 files allowed per request', 400);
      }

      const uploadPromises = files.map(file => 
        this.uploadFile(file, folder, 'auto', options)
      );

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push({
            fileName: files[index].originalname,
            error: result.reason.message
          });
        }
      });

      return {
        successful,
        failed,
        total: files.length,
        successCount: successful.length,
        failureCount: failed.length,
        success: failed.length === 0
      };
    } catch (error) {
      console.error('❌ Multiple file upload failed:', error.message);
      throw new AppError(`Multiple file upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Upload certificate files
   */
  async uploadCertificateFiles(files, certificateId) {
    try {
      const folder = `portfolio/certificates/${certificateId}`;
      const options = {
        tags: [`certificate:${certificateId}`, 'certificate-file']
      };

      const result = await this.uploadMultipleFiles(files, folder, options);
      
      result.files = result.successful.map(file => ({
        ...file,
        visible: true,
        category: 'certificate'
      }));

      return result;
    } catch (error) {
      console.error('❌ Certificate files upload failed:', error.message);
      throw new AppError(`Certificate files upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId, resourceType = 'raw') {
    try {
      const validResourceTypes = ['image', 'javascript', 'css', 'video', 'raw'];
      if (!validResourceTypes.includes(resourceType)) {
        throw new AppError(`Invalid resource type '${resourceType}'`, 400);
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      if (result.result === 'ok') {
        console.log(`✅ File deleted successfully: ${publicId}`);
        return { success: true };
      } else {
        console.warn(`⚠️ File deletion result: ${result.result} for ${publicId}`);
        return { success: false };
      }
    } catch (error) {
      console.error(`❌ Failed to delete file ${publicId}:`, error);
      throw new AppError(`File deletion failed: ${error.message}`, 500);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(publicIds, resourceType = 'auto') {
    try {
      const deletePromises = publicIds.map(publicId => 
        this.deleteFile(publicId, resourceType)
      );

      const results = await Promise.allSettled(deletePromises);
      
      const successful = [];
      const failed = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push(publicIds[index]);
        } else {
          failed.push({
            publicId: publicIds[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      return {
        successful,
        failed,
        total: publicIds.length,
        successCount: successful.length,
        failureCount: failed.length
      };
    } catch (error) {
      console.error('❌ Multiple file deletion failed:', error.message);
      throw new AppError(`Multiple file deletion failed: ${error.message}`, 500);
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(publicId, resourceType = 'auto') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        tags: result.tags || []
      };
    } catch (error) {
      console.error(`❌ Failed to get file info for ${publicId}:`, error.message);
      throw new AppError(`Failed to get file info: ${error.message}`, 500);
    }
  }

  /**
   * List files by folder
   */
  async listFiles(folder, options = {}) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: options.maxResults || 100,
        sort_by: [{ created_at: 'desc' }],
        ...options
      });

      return result.resources?.map(resource => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        size: resource.bytes,
        width: resource.width,
        height: resource.height,
        createdAt: resource.created_at,
        tags: resource.tags || []
      })) || [];
    } catch (error) {
      console.error(`❌ Failed to list files in folder ${folder}:`, error.message);
      throw new AppError(`Failed to list files: ${error.message}`, 500);
    }
  }

  /**
   * Categorize file based on MIME type
   */
  categorizeFile(mimeType) {
    if (this.allowedMimeTypes.images.includes(mimeType)) {
      return 'image';
    } else if (this.allowedMimeTypes.documents.includes(mimeType)) {
      return 'document';
    } else if (this.allowedMimeTypes.archives.includes(mimeType)) {
      return 'archive';
    } else if (this.allowedMimeTypes.videos.includes(mimeType)) {
      return 'video';
    } else {
      return 'other';
    }
  }

  /**
   * Get multer middleware for file uploads
   */
  getUploadMiddleware(fieldName = 'files', maxCount = 10) {
    return this.uploader.array(fieldName, maxCount);
  }

  /**
   * Get multer middleware for single file upload
   */
  getSingleUploadMiddleware(fieldName = 'file') {
    return this.uploader.single(fieldName);
  }
}

const fileService = new FileService();
module.exports = {
  ...fileService,
  getUploadMiddleware: (fieldName = 'files', maxCount = 10) => fileService.getUploadMiddleware(fieldName, maxCount),
  getSingleUploadMiddleware: (fieldName = 'file') => fileService.getSingleUploadMiddleware(fieldName),
  uploadFile: (file, folder, options) => fileService.uploadFile(file, folder, 'auto', options),
  uploadCertificateFiles: (files, certificateId) => fileService.uploadCertificateFiles(files, certificateId),
  deleteFile: (publicId) => fileService.deleteFile(publicId),
  deleteMultipleFiles: (publicIds) => fileService.deleteMultipleFiles(publicIds)
};
