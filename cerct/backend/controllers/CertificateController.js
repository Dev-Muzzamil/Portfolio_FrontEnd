const contentService = require('../../services/content/ContentService');
const PDFService = require('../../services/content/PDFService');
const FileService = require('../../services/content/FileService');
const ReportService = require('../../services/content/ReportService');
const AuditLog = require('../../models/system/AuditLog');
const { validationResult } = require('express-validator');

class CertificateController {
  // GET /api/v1/admin/certificates
  static async getAllCertificates(req, res, next) {
    try {
      const certificates = await contentService.getAllContent('certificate', { 
        visibility: { $in: ['public', 'private', 'hidden'] } 
      });
      res.json(certificates);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/certificates/:id
  static async getCertificateById(req, res, next) {
    try {
      const certificate = await contentService.getContent('certificate', req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }
      res.json(certificate);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/certificates
  static async createCertificate(req, res, next) {
    try {
      if (!req.body.title || !req.body.issuer) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and issuer are required' 
        });
      }

      const certificate = await contentService.createContent('certificate', req.body, req.user.id);
      
      await AuditLog.logAction({
        action: 'create',
        resourceType: 'certificate',
        resourceId: certificate._id,
        userId: req.user.id,
        userEmail: req.user.email || 'unknown@example.com',
        userRole: req.user.role || 'user',
        description: 'Created certificate',
        details: { newValue: certificate },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json(certificate);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/certificates/with-files
  static async createCertificateWithFiles(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const certificateData = { ...req.body };
      let uploadedFiles = [];
      let extractedData = null;

      // Handle file uploads if any
      if (req.files && req.files.length > 0) {
        const uploadResult = await FileService.uploadCertificateFiles(req.files, 'temp');
        
        if (uploadResult.success) {
          uploadedFiles = uploadResult.files;
          
          // Generate thumbnails for PDF files
          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            if (file.mimetype === 'application/pdf') {
              try {
                const thumbnailResult = await PDFService.generatePDFThumbnail(file.buffer, file.originalname);
                if (thumbnailResult.success) {
                  uploadedFiles[i].thumbnailUrl = thumbnailResult.thumbnailUrl;
                  uploadedFiles[i].thumbnailPublicId = thumbnailResult.thumbnailPublicId;
                }
              } catch (error) {
                console.error('Failed to generate PDF thumbnail:', error);
              }
            }
          }
        }
        
        certificateData.files = uploadedFiles;

        // Auto-extract details from the first uploaded file
        const firstFile = req.files[0];
        if (firstFile && (firstFile.mimetype.startsWith('image/') || firstFile.mimetype === 'application/pdf')) {
          try {
            console.log('🔍 Attempting auto-extraction from uploaded file:', firstFile.originalname);
            const extractionResult = await PDFService.processCertificateFile(firstFile);
            if (extractionResult.success) {
              extractedData = extractionResult.extractedData;
              console.log('✅ Auto-extraction successful:', extractedData);
            }
          } catch (error) {
            console.log('Auto-extraction failed:', error.message);
          }
        }
      }

      const certificate = await contentService.createContent('certificate', certificateData, req.user.id);
      
      await AuditLog.logAction({
        action: 'create',
        resourceType: 'certificate',
        resourceId: certificate._id,
        userId: req.user.id,
        userEmail: req.user.email || 'unknown@example.com',
        userRole: req.user.role || 'user',
        description: 'Created certificate with files',
        details: { newValue: certificate },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(201).json({
        certificate,
        extractedData
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/admin/certificates/:id
  static async updateCertificate(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const oldCertificate = await contentService.getContent('certificate', req.params.id);
      if (!oldCertificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      const certificate = await contentService.updateContent('certificate', req.params.id, req.body, req.user.id);
      
      await AuditLog.logAction({
        action: 'update',
        resourceType: 'certificate',
        resourceId: certificate._id,
        userId: req.user.id,
        userEmail: req.user.email || 'unknown@example.com',
        userRole: req.user.role || 'user',
        description: 'Updated certificate',
        details: {
          oldValue: oldCertificate,
          newValue: certificate
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(certificate);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/admin/certificates/:id/visibility
  static async toggleVisibility(req, res, next) {
    try {
      const { visible } = req.body;
      const certificate = await contentService.updateContent('certificate', req.params.id, { visible }, req.user.id);
      
      await AuditLog.logAction({
        action: 'update',
        resourceType: 'certificate',
        resourceId: certificate._id,
        userId: req.user.id,
        userEmail: req.user.email || 'unknown@example.com',
        userRole: req.user.role || 'user',
        description: 'Toggled certificate visibility',
        details: { newValue: { visible } },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json(certificate);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/admin/certificates/:id
  static async deleteCertificate(req, res, next) {
    try {
      const certificate = await contentService.getContent('certificate', req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      await contentService.deleteContent('certificate', req.params.id, req.user.id);
      
      await AuditLog.logAction({
        action: 'delete',
        resourceType: 'certificate',
        resourceId: certificate._id,
        userId: req.user.id,
        userEmail: req.user.email || 'unknown@example.com',
        userRole: req.user.role || 'user',
        description: 'Deleted certificate',
        details: { oldValue: certificate },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/certificates/extract-details
  static async extractDetails(req, res, next) {
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
  }

  // POST /api/v1/admin/certificates/:id/upload-files
  static async uploadFiles(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const certificate = await contentService.getContent('certificate', req.params.id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      const uploadResult = await FileService.uploadCertificateFiles(req.files, certificate._id);
      
      if (uploadResult.success) {
        const updatedCertificate = await contentService.updateContent('certificate', req.params.id, { files: [...(certificate.files || []), ...uploadResult.files] }, req.user.id);

        res.json({
          message: `${uploadResult.files.length} files uploaded successfully`,
          files: uploadResult.files,
          certificate: updatedCertificate
        });
      } else {
        res.status(500).json({
          message: 'Failed to upload files',
          error: uploadResult.error
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/admin/certificates/:id/files/:fileId
  static async deleteFile(req, res, next) {
    try {
      const { id, fileId } = req.params;
      
      const certificate = await contentService.getContent('certificate', id);
      if (!certificate) {
        return res.status(404).json({ message: 'Certificate not found' });
      }

      const file = certificate.files.id(fileId);
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      if (file.publicId) {
        const deleteResult = await FileService.deleteFile(file.publicId);
        if (!deleteResult.success) {
          console.warn('Failed to delete file from Cloudinary:', deleteResult.error);
        }
      }

      certificate.files.pull(fileId);
      await certificate.save();

      res.json({
        message: 'File deleted successfully',
        certificate
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/certificates/:id/reports
  static async createReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await ReportService.createReport('certificate', req.params.id, req.body, req.user.id);

      if (result.success) {
        res.status(201).json({
          message: 'Report created successfully',
          report: result.report
        });
      } else {
        res.status(500).json({
          error: result.error,
          code: 'CREATE_REPORT_ERROR'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/certificates/:id/statistics
  static async getStatistics(req, res, next) {
    try {
      const totalCertificates = await Certificate.countDocuments();
      const publishedCertificates = await Certificate.countDocuments({ status: 'published' });
      const featuredCertificates = await Certificate.countDocuments({ featured: true, status: 'published' });
      
      const statistics = {
        total: totalCertificates,
        published: publishedCertificates,
        featured: featuredCertificates,
        draft: totalCertificates - publishedCertificates,
        publishedPercentage: totalCertificates > 0 ? Math.round((publishedCertificates / totalCertificates) * 100) : 0
      };

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/v1/admin/certificates/:id/featured
  static async toggleFeatured(req, res, next) {
    try {
      const certificate = await contentService.updateContent('certificate', req.params.id, { featured: req.body.featured }, req.user.id);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found'
        });
      }

      res.json({
        success: true,
        data: certificate,
        message: `Certificate ${certificate.featured ? 'featured' : 'unfeatured'} successfully`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CertificateController;
